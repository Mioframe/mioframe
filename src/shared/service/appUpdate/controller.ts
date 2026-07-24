import type { AppUpdatePublicErrorCode } from './publicContracts';
import type {
  ControllerResponse,
  LatestRelease,
  ReleaseControllerCommand,
  ReleaseControllerState,
  ReleaseIdentity,
  UpdateMode,
} from './contracts';
import {
  RELEASE_DESCRIPTOR_SCHEMA_VERSION,
  isSameReleaseIdentity,
  releaseControllerCommandSchema,
} from './contracts';
import { createCommandQueue } from './commandQueue';
import type { ReleaseControllerStateStore } from './persistence';
import {
  cleanupStaleStagingCaches,
  fetchValidatedReleaseMetadata,
  isReleaseAvailable,
  prepareRelease,
} from './releaseCache';
import { committedRelease, isStrictlyNewerRelease, projectAppUpdateSnapshot } from './stateMachine';
import { confirmTrialBoot, createTrial, rollbackExpiredTrial } from './trial';

/** A running/stale operation older than this is treated as abandoned by a terminated worker. */
const STALE_OPERATION_MS = 2 * 60 * 1000;

/** Private local-window VFS-readiness query, asked only of the requesting client. */
export type VfsReadiness = (clientId: string) => Promise<boolean>;

/** Minimal live stable-window fact used only for Manual update-window counting. */
export type StableWindow = { /** Live client id. */ id: string };

/** Private command execution with optional worker-lifetime background work. */
export type ControllerExecution = {
  /** Immediate response sent through the request port. */
  response: ControllerResponse;
  /** Long work retained by the service-worker event lifetime. */
  background?: () => Promise<void>;
};

const errorResult = (code: AppUpdatePublicErrorCode) => ({
  status: 'error' as const,
  code,
});

const execution = (
  response: ControllerResponse,
  background?: () => Promise<void>,
): ControllerExecution => ({ response, ...(background && { background }) });

const descriptorFor = (release: ReleaseIdentity): LatestRelease => ({
  schemaVersion: RELEASE_DESCRIPTOR_SCHEMA_VERSION,
  release,
  descriptorUrl: `/updates/releases/${release.releaseId}.json`,
});

/**
 * Create the private persistent release controller.
 * @param root0 - Controller dependencies and deterministic boundaries.
 * @returns Private serialized controller command executor.
 */
export const createReleaseController = ({
  currentRelease,
  store,
  now = () => new Date(),
  operationId = () => crypto.randomUUID(),
  vfsReadiness = () => Promise.resolve(true),
  liveStableWindows = () => Promise.resolve([]),
  publish = () => undefined,
  onTrialStarted = () => Promise.resolve(),
}: {
  /** Release serving the controller worker artifact. */
  currentRelease: ReleaseIdentity;
  /** Dedicated durable controller store. */
  store: ReleaseControllerStateStore;
  /** Deterministic time source. */
  now?: () => Date;
  /** Deterministic operation-token source. */
  operationId?: () => string;
  /** Local VFS-activity readiness for one requesting client. */
  vfsReadiness?: VfsReadiness;
  /**
   * All live controlled stable-URL windows, from the worker's raw `clients.matchAll` classification
   * — not the handshake-registered subset. A window that is live but has not yet completed its own
   * handshake with a new worker must still block Manual `Update now`, so this must never undercount.
   */
  liveStableWindows?: () => Promise<StableWindow[]>;
  /** Snapshot broadcast boundary. */
  publish?: (state: ReleaseControllerState) => void;
  /** Single requesting-client reload boundary after trial persistence. */
  onTrialStarted?: (target: ReleaseIdentity, clientId: string) => Promise<void>;
}) => {
  const enqueue = createCommandQueue();
  const readSafely = () => store.read(currentRelease);
  const save = async (state: ReleaseControllerState) => {
    await store.write(state);
    publish(state);
    return state;
  };

  // `requestingClientId` names the window that must be told to reload for a Manual trial. It is
  // never persisted as `trial.initiatingClientId`: that field instead records which navigation has
  // already claimed the trial (see `associateTrialNavigation`), and the requesting window's reload
  // is itself the first such navigation, arriving under a brand-new client id after it completes.
  const beginTrial = async (
    target: ReleaseIdentity,
    requestingClientId?: string,
  ): Promise<void> => {
    await enqueue(async () => {
      const { state, capability } = await readSafely();
      if (capability === 'unavailable' || state.trial) return;
      if (
        state.preparation.status !== 'ready' ||
        state.preparation.release.releaseId !== target.releaseId
      )
        return;
      // A target that no longer matches the canonical latest is obsolete — the canonical latest
      // has already moved on to a different release since this preparation was started, and an
      // obsolete target must never start a trial.
      if (state.latestRelease === undefined || !isSameReleaseIdentity(target, state.latestRelease))
        return;
      await save(createTrial({ state, targetRelease: target, now: now() }));
      if (requestingClientId) await onTrialStarted(target, requestingClientId);
    });
  };

  const finishPreparation = async (
    token: string,
    latest: LatestRelease,
    activateAfterPreparation: boolean,
    initiatingClientId?: string,
  ): Promise<void> => {
    try {
      await prepareRelease(latest);
      const shouldActivate = await enqueue(async () => {
        const { state, capability } = await readSafely();
        if (
          capability === 'unavailable' ||
          state.preparation.status !== 'running' ||
          state.preparation.operationId !== token
        )
          return false;
        // A target that no longer matches the canonical latest is obsolete: `latestRelease` has
        // already advanced to a different release while this preparation was running. An
        // obsolete completion may only clean up (fall to `idle`), never mark `ready` over the
        // current canonical latest's state, and never activate a trial for it.
        const targetsLatest =
          state.latestRelease === undefined ||
          isSameReleaseIdentity(latest.release, state.latestRelease);
        const eligible =
          targetsLatest &&
          !state.failedReleaseIds.includes(latest.release.releaseId) &&
          isStrictlyNewerRelease(latest.release, committedRelease(state));
        await save(
          eligible
            ? {
                ...state,
                preparation: { status: 'ready', release: latest.release },
                errorCode: undefined,
              }
            : { ...state, preparation: { status: 'idle' } },
        );
        return activateAfterPreparation && eligible;
      });
      if (shouldActivate) await beginTrial(latest.release, initiatingClientId);
    } catch {
      await enqueue(async () => {
        const { state, capability } = await readSafely();
        if (
          capability === 'unavailable' ||
          state.preparation.status !== 'running' ||
          state.preparation.operationId !== token
        )
          return;
        const targetsLatest =
          state.latestRelease === undefined ||
          isSameReleaseIdentity(latest.release, state.latestRelease);
        if (!targetsLatest) {
          await save({ ...state, preparation: { status: 'idle' } });
          return;
        }
        await save({
          ...state,
          preparation: { status: 'failed', release: latest.release },
          errorCode: 'preparationFailed',
        });
      });
    }
  };

  const startPreparation = async (
    state: ReleaseControllerState,
    latest: LatestRelease,
    activateAfterPreparation: boolean,
    initiatingClientId?: string,
  ): Promise<(() => Promise<void>) | undefined> => {
    if (
      !isStrictlyNewerRelease(latest.release, committedRelease(state)) ||
      state.failedReleaseIds.includes(latest.release.releaseId)
    )
      return undefined;
    if (await isReleaseAvailable(latest.release)) {
      await save({
        ...state,
        preparation: { status: 'ready', release: latest.release },
        errorCode: undefined,
      });
      return activateAfterPreparation
        ? () => beginTrial(latest.release, initiatingClientId)
        : undefined;
    }
    if (
      state.preparation.status === 'running' &&
      isSameReleaseIdentity(state.preparation.release, latest.release)
    )
      return undefined;
    const token = operationId();
    await save({
      ...state,
      preparation: {
        status: 'running',
        release: latest.release,
        operationId: token,
        startedAt: now().toISOString(),
      },
      errorCode: undefined,
    });
    return () => finishPreparation(token, latest, activateAfterPreparation, initiatingClientId);
  };

  const finishCheck = async (token: string): Promise<void> => {
    try {
      const response = await fetch('/updates/latest.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Latest release request failed.');
      const latestValue: unknown = await response.json();
      const { latest } = await fetchValidatedReleaseMetadata(latestValue);
      let preparation: (() => Promise<void>) | undefined;
      await enqueue(async () => {
        const { state, capability } = await readSafely();
        if (
          capability === 'unavailable' ||
          state.check.status !== 'running' ||
          state.check.operationId !== token
        )
          return;
        const running = committedRelease(state);
        // `reference` names whichever release currently owns the highest known sequence: the
        // latest already discovered, or the running release when nothing newer is known yet.
        // A same-sequence report that does not match its full identity is invalid metadata, not
        // an accepted update — accepting it on sequence alone would let a corrupt or conflicting
        // record silently replace a confirmed latest release.
        const reference = state.latestRelease ?? running;
        if (
          latest.release.releaseSequence === reference.releaseSequence &&
          !isSameReleaseIdentity(latest.release, reference)
        ) {
          await save({
            ...state,
            check: { status: 'failed', lastSuccessAt: state.check.lastSuccessAt },
            errorCode: 'invalidReleaseMetadata',
          });
          return;
        }
        const latestRelease =
          latest.release.releaseSequence >= reference.releaseSequence
            ? latest.release
            : state.latestRelease;
        const next = await save({
          ...state,
          ...(latestRelease && { latestRelease }),
          check: { status: 'idle', lastSuccessAt: now().toISOString() },
          errorCode: undefined,
        });
        // Always prepare the resolved canonical latest, never the raw incoming pointer: a stale
        // incoming check response must not be handed to `startPreparation` even though it can
        // never become the persisted canonical latest itself.
        if (next.mode === 'automatic' && next.latestRelease)
          preparation = await startPreparation(next, descriptorFor(next.latestRelease), false);
      });
      await preparation?.();
    } catch {
      await enqueue(async () => {
        const { state, capability } = await readSafely();
        if (
          capability === 'unavailable' ||
          state.check.status !== 'running' ||
          state.check.operationId !== token
        )
          return;
        await save({
          ...state,
          check: { status: 'failed', lastSuccessAt: state.check.lastSuccessAt },
          errorCode: 'checkFailed',
        });
      });
    }
  };

  const startCheck = async (
    state: ReleaseControllerState,
  ): Promise<(() => Promise<void>) | undefined> => {
    if (state.check.status === 'running') return undefined;
    const token = operationId();
    await save({
      ...state,
      check: {
        status: 'running',
        operationId: token,
        startedAt: now().toISOString(),
        lastSuccessAt: state.check.lastSuccessAt,
      },
      errorCode: undefined,
    });
    return () => finishCheck(token);
  };

  const setMode = async (
    state: ReleaseControllerState,
    mode: UpdateMode,
  ): Promise<(() => Promise<void>) | undefined> => {
    if (state.mode === mode) return undefined;
    const preservingTrial = state.trial !== undefined;
    const next = await save({
      ...state,
      mode,
      pinnedRelease: mode === 'manual' ? state.activeRelease : undefined,
      ...(!preservingTrial && { preparation: { status: 'idle' as const } }),
      errorCode: undefined,
    });
    if (preservingTrial || mode !== 'automatic' || !next.latestRelease) return undefined;
    return startPreparation(next, descriptorFor(next.latestRelease), false);
  };

  let reconciledOnce: Promise<void> | undefined;
  const reconcile = () =>
    (reconciledOnce ??= (async () => {
      await cleanupStaleStagingCaches();
      await enqueue(async () => {
        const { state, capability } = await readSafely();
        if (capability === 'unavailable') return;
        const staleBefore = new Date(now().getTime() - STALE_OPERATION_MS).toISOString();
        let next = state;
        if (next.check.status === 'running' && next.check.startedAt < staleBefore) {
          next = { ...next, check: { status: 'idle', lastSuccessAt: next.check.lastSuccessAt } };
        }
        if (next.preparation.status === 'running' && next.preparation.startedAt < staleBefore) {
          const target = next.preparation.release;
          next = {
            ...next,
            preparation: (await isReleaseAvailable(target))
              ? { status: 'ready', release: target }
              : { status: 'idle' },
          };
        }
        if (next !== state) await save(next);
      });
    })());

  return {
    reconcile,
    async execute(commandValue: unknown, sourceClientId = ''): Promise<ControllerExecution> {
      await reconcile();
      return enqueue(async () => {
        const parsed = releaseControllerCommandSchema.safeParse(commandValue);
        if (!parsed.success) {
          return { response: { kind: 'action', result: errorResult('capabilityUnavailable') } };
        }
        const command: ReleaseControllerCommand = parsed.data;
        const read = await readSafely();
        if (read.capability === 'unavailable') {
          if (command.type === 'GET_SNAPSHOT') {
            return {
              response: {
                kind: 'snapshot',
                snapshot: projectAppUpdateSnapshot(read.state, 'unavailable', sourceClientId),
              },
            };
          }
          return { response: { kind: 'action', result: errorResult('capabilityUnavailable') } };
        }
        try {
          const rolledBack = rollbackExpiredTrial(read.state, now());
          const state = rolledBack === read.state ? read.state : await save(rolledBack);
          switch (command.type) {
            case 'GET_SNAPSHOT':
              return {
                response: {
                  kind: 'snapshot',
                  snapshot: projectAppUpdateSnapshot(state, 'available', sourceClientId),
                },
              };
            case 'CHECK_FOR_UPDATES':
              // An active trial is an exclusive controller phase: no new check may start while
              // it is in progress, and the trial itself is left byte-for-byte unchanged.
              if (state.trial) {
                return { response: { kind: 'action', result: { status: 'accepted' } } };
              }
              return execution(
                { kind: 'action', result: { status: 'accepted' } },
                await startCheck(state),
              );
            case 'SET_MODE':
              // Mode (and pin) must remain unchanged until trial commit or rollback — an active
              // trial rejects mode changes as a no-op rather than switching mid-trial.
              if (state.trial) {
                return { response: { kind: 'action', result: { status: 'accepted' } } };
              }
              return execution(
                { kind: 'action', result: { status: 'accepted' } },
                await setMode(state, command.mode),
              );
            case 'UPDATE_NOW': {
              if (state.trial) {
                return { response: { kind: 'action', result: { status: 'accepted' } } };
              }
              const latest = state.latestRelease;
              if (!isStrictlyNewerRelease(latest, committedRelease(state))) {
                return { response: { kind: 'action', result: errorResult('checkFailed') } };
              }
              if (state.failedReleaseIds.includes(latest.releaseId)) {
                return { response: { kind: 'action', result: errorResult('checkFailed') } };
              }
              if (!(await vfsReadiness(sourceClientId))) {
                return {
                  response: {
                    kind: 'action',
                    result: { status: 'blocked', code: 'blockedByActivity' },
                  },
                };
              }
              const otherWindows = (await liveStableWindows()).filter(
                (client) => client.id !== sourceClientId,
              );
              if (otherWindows.length > 0) {
                return {
                  response: {
                    kind: 'action',
                    result: { status: 'blocked', code: 'blockedByOtherWindows' },
                  },
                };
              }
              return execution(
                { kind: 'action', result: { status: 'accepted' } },
                await startPreparation(state, descriptorFor(latest), true, sourceClientId),
              );
            }
            case 'PRIVATE_BOOT_READY':
              await save(confirmTrialBoot(state, sourceClientId, command.releaseId));
              return { response: { kind: 'action', result: { status: 'accepted' } } };
          }
        } catch {
          return { response: { kind: 'action', result: errorResult('storageUnavailable') } };
        }
      });
    },
  };
};
