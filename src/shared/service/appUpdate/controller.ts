import type { AppUpdatePublicErrorCode } from './publicContracts';
import type {
  ControllerResponse,
  LatestRelease,
  ReleaseControllerCommand,
  ReleaseControllerState,
  ReleaseIdentity,
  UpdateMode,
} from './contracts';
import { RELEASE_DESCRIPTOR_SCHEMA_VERSION, releaseControllerCommandSchema } from './contracts';
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

/** Minimal registered stable window fact used only for Manual update-window counting. */
export type RegisteredStableWindow = { /** Live client id. */ id: string };

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
  registeredStableWindows = () => Promise.resolve([]),
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
  /** Live registered stable windows, used only to count open windows for Manual updates. */
  registeredStableWindows?: () => Promise<RegisteredStableWindow[]>;
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
        const eligible =
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
      state.preparation.release.releaseId === latest.release.releaseId
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
        const latestRelease =
          latest.release.releaseSequence >=
          Math.max(running.releaseSequence, state.latestRelease?.releaseSequence ?? 0)
            ? latest.release
            : state.latestRelease;
        const next = await save({
          ...state,
          ...(latestRelease && { latestRelease }),
          check: { status: 'idle', lastSuccessAt: now().toISOString() },
          errorCode: undefined,
        });
        if (next.mode === 'automatic') preparation = await startPreparation(next, latest, false);
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
                snapshot: projectAppUpdateSnapshot(read.state, 'unavailable'),
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
              return { response: { kind: 'snapshot', snapshot: projectAppUpdateSnapshot(state) } };
            case 'CHECK_FOR_UPDATES':
              return execution(
                { kind: 'action', result: { status: 'accepted' } },
                await startCheck(state),
              );
            case 'SET_MODE':
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
              const otherWindows = (await registeredStableWindows()).filter(
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
              await save(confirmTrialBoot(state, command.releaseId));
              return { response: { kind: 'action', result: { status: 'accepted' } } };
          }
        } catch {
          return { response: { kind: 'action', result: errorResult('storageUnavailable') } };
        }
      });
    },
  };
};
