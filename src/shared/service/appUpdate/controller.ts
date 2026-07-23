import type {
  AppUpdateActionResult,
  AppUpdatePublicErrorCode,
  AppUpdateSnapshot,
} from './publicContracts';
import type {
  LatestRelease,
  ReleaseControllerCommand,
  ReleaseControllerState,
  ReleaseIdentity,
  UpdateMode,
} from './contracts';
import { releaseControllerCommandSchema } from './contracts';
import { createActivationTransaction, releaseForClient } from './activationTransaction';
import { confirmReplacementBoot } from './activationTransaction';
import { createCommandQueue } from './commandQueue';
import type { ReleaseControllerStateStore } from './persistence';
import { fetchValidatedReleaseMetadata, isReleaseAvailable, prepareRelease } from './releaseCache';
import { isStrictlyNewerRelease, projectAppUpdateSnapshot } from './stateMachine';

/** Private stable-window readiness query. */
export type RestartReadiness = () => Promise<{
  /** Aggregate readiness state. */
  status: 'ready' | 'busy' | 'unresponsive';
  /** Stable clients included in the readiness decision. */
  clientIds: string[];
}>;

/** Private worker transport response. */
export type ControllerResponse =
  | {
      /** Response discriminator. */ kind: 'snapshot';
      /** UI-safe state. */ snapshot: AppUpdateSnapshot;
    }
  | {
      /** Response discriminator. */ kind: 'action';
      /** Immediate action result. */ result: AppUpdateActionResult;
    };

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
  readiness = () => Promise.resolve({ status: 'ready', clientIds: [] }),
  publish = () => undefined,
  onActivationStarted = () => Promise.resolve(),
}: {
  /** Release serving the controller worker artifact. */
  currentRelease: ReleaseIdentity;
  /** Dedicated durable controller store. */
  store: ReleaseControllerStateStore;
  /** Deterministic time source. */
  now?: () => Date;
  /** Deterministic operation-token source. */
  operationId?: () => string;
  /** Stable-client readiness boundary. */
  readiness?: RestartReadiness;
  /** Snapshot broadcast boundary. */
  publish?: (state: ReleaseControllerState) => void;
  /** Stable-client reload boundary after transaction persistence. */
  onActivationStarted?: (transactionId: string, clientIds: string[]) => Promise<void>;
}) => {
  const enqueue = createCommandQueue();
  const read = () => store.read(currentRelease);
  const save = async (state: ReleaseControllerState) => {
    await store.write(state);
    publish(state);
    return state;
  };

  const finishPreparation = async (
    token: string,
    latest: LatestRelease,
    activateAfterPreparation: boolean,
  ): Promise<void> => {
    try {
      await prepareRelease(latest);
      const shouldActivate = await enqueue(async () => {
        const state = await read();
        if (state.preparationOperationId !== token) return false;
        const eligible =
          !state.failedReleaseIds.includes(latest.release.releaseId) &&
          isStrictlyNewerRelease(latest.release, state.activeRelease);
        const next: ReleaseControllerState = eligible
          ? {
              ...state,
              preparedRelease: latest.release,
              preparationState: 'ready',
              preparationOperationId: undefined,
              activationRequested: undefined,
              errorCode: undefined,
            }
          : {
              ...state,
              preparationState: 'idle',
              preparationOperationId: undefined,
              activationRequested: undefined,
            };
        await save(next);
        return (activateAfterPreparation || state.activationRequested === true) && eligible;
      });
      if (shouldActivate) await beginActivation(latest.release);
    } catch {
      await enqueue(async () => {
        const state = await read();
        if (state.preparationOperationId !== token) return;
        await save({
          ...state,
          preparationState: 'failed',
          preparationOperationId: undefined,
          activationRequested: undefined,
          errorCode: 'preparationFailed',
        });
      });
    }
  };

  const startPreparation = async (
    state: ReleaseControllerState,
    latest: LatestRelease,
    activateAfterPreparation: boolean,
  ): Promise<(() => Promise<void>) | undefined> => {
    if (
      !isStrictlyNewerRelease(latest.release, state.activeRelease) ||
      state.failedReleaseIds.includes(latest.release.releaseId)
    )
      return undefined;
    if (await isReleaseAvailable(latest.release)) {
      await save({
        ...state,
        preparedRelease: latest.release,
        preparationState: 'ready',
        errorCode: undefined,
      });
      return activateAfterPreparation ? () => beginActivation(latest.release) : undefined;
    }
    if (state.preparationState === 'preparing') {
      if (activateAfterPreparation && !state.activationRequested) {
        await save({ ...state, activationRequested: true });
      }
      return undefined;
    }
    const token = operationId();
    await save({
      ...state,
      preparationState: 'preparing',
      preparationOperationId: token,
      errorCode: undefined,
    });
    return () => finishPreparation(token, latest, activateAfterPreparation);
  };

  const finishCheck = async (token: string): Promise<void> => {
    try {
      const response = await fetch('/updates/latest.json', { cache: 'no-store' });
      if (!response.ok) throw new Error('Latest release request failed.');
      const latestValue: unknown = await response.json();
      const { latest } = await fetchValidatedReleaseMetadata(latestValue);
      let preparation: (() => Promise<void>) | undefined;
      await enqueue(async () => {
        const state = await read();
        if (state.checkOperationId !== token) return;
        const confirmedLatestRelease =
          latest.release.releaseSequence >=
          Math.max(
            state.activeRelease.releaseSequence,
            state.confirmedLatestRelease?.releaseSequence ?? 0,
          )
            ? latest.release
            : state.confirmedLatestRelease;
        const next = await save({
          ...state,
          ...(confirmedLatestRelease && { confirmedLatestRelease }),
          checkState: 'succeeded',
          checkOperationId: undefined,
          lastSuccessfulCheckAt: now().toISOString(),
          errorCode: undefined,
        });
        if (next.mode === 'automatic') preparation = await startPreparation(next, latest, false);
      });
      await preparation?.();
    } catch {
      await enqueue(async () => {
        const state = await read();
        if (state.checkOperationId !== token) return;
        await save({
          ...state,
          checkState: 'failed',
          checkOperationId: undefined,
          errorCode: 'checkFailed',
        });
      });
    }
  };

  const startCheck = async (
    state: ReleaseControllerState,
  ): Promise<(() => Promise<void>) | undefined> => {
    if (state.checkState === 'checking') return undefined;
    const token = operationId();
    await save({ ...state, checkState: 'checking', checkOperationId: token, errorCode: undefined });
    return () => finishCheck(token);
  };

  const beginActivation = async (target: ReleaseIdentity): Promise<void> => {
    const ready = await readiness();
    await enqueue(async () => {
      const state = await read();
      if (state.preparedRelease?.releaseId !== target.releaseId) return;
      if (ready.status !== 'ready') {
        await save({
          ...state,
          activationState: ready.status === 'busy' ? 'blockedByActivity' : 'blockedByWindow',
          errorCode: ready.status === 'busy' ? 'restartBusy' : 'restartUnresponsive',
        });
        return;
      }
      const activated = await save(
        createActivationTransaction({
          state,
          targetRelease: target,
          oldClientIds: ready.clientIds,
          now: now(),
        }),
      );
      const transactionId = activated.activationTransaction?.transactionId;
      if (transactionId) await onActivationStarted(transactionId, ready.clientIds);
    });
  };

  const setMode = async (
    state: ReleaseControllerState,
    mode: UpdateMode,
  ): Promise<(() => Promise<void>) | undefined> => {
    if (state.mode === mode) return undefined;
    const next = await save(
      mode === 'manual'
        ? {
            ...state,
            mode,
            pinnedRelease: state.activeRelease,
            preparedRelease: undefined,
            preparationState: 'idle',
            preparationOperationId: undefined,
            activationRequested: undefined,
            activationState: 'idle',
            errorCode: undefined,
          }
        : {
            ...state,
            mode,
            pinnedRelease: undefined,
            preparationOperationId: undefined,
            activationRequested: undefined,
            preparationState: 'idle',
            errorCode: undefined,
          },
    );
    const latest = next.confirmedLatestRelease;
    return mode === 'automatic' && latest
      ? startPreparation(
          next,
          {
            schemaVersion: 2,
            release: latest,
            descriptorUrl: `/updates/releases/${latest.releaseId}.json`,
          },
          false,
        )
      : undefined;
  };

  return {
    execute(commandValue: unknown, sourceClientId = ''): Promise<ControllerExecution> {
      return enqueue(async () => {
        const parsed = releaseControllerCommandSchema.safeParse(commandValue);
        if (!parsed.success) {
          return { response: { kind: 'action', result: errorResult('capabilityUnavailable') } };
        }
        const command: ReleaseControllerCommand = parsed.data;
        try {
          const state = await read();
          switch (command.type) {
            case 'GET_SNAPSHOT':
              return {
                response: {
                  kind: 'snapshot',
                  snapshot: projectAppUpdateSnapshot(
                    state,
                    releaseForClient(state, sourceClientId),
                  ),
                },
              };
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
              const latest = state.confirmedLatestRelease;
              if (!latest || !isStrictlyNewerRelease(latest, state.activeRelease)) {
                return { response: { kind: 'action', result: errorResult('checkFailed') } };
              }
              const descriptorLatest: LatestRelease = {
                schemaVersion: 2,
                release: latest,
                descriptorUrl: `/updates/releases/${latest.releaseId}.json`,
              };
              return execution(
                { kind: 'action', result: { status: 'accepted' } },
                await startPreparation(state, descriptorLatest, true),
              );
            }
            case 'PRIVATE_BOOT_READY':
              await save(confirmReplacementBoot(state, sourceClientId, command.releaseId));
              return { response: { kind: 'action', result: { status: 'accepted' } } };
          }
        } catch {
          return { response: { kind: 'action', result: errorResult('storageUnavailable') } };
        }
      });
    },
  };
};
