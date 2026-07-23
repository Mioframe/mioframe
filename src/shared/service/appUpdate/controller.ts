/* eslint-disable jsdoc/require-jsdoc -- Controller dependencies and command outcomes are explicit in the factory signature. */
import type {
  AppUpdateOutcome,
  LatestRelease,
  ReleaseControllerCommand,
  ReleaseControllerState,
  ReleaseIdentity,
} from './contracts';
import { latestReleaseSchema, releaseControllerCommandSchema } from './contracts';
import { createCommandQueue } from './commandQueue';
import type { ReleaseControllerStateStore } from './persistence';
import { isReleaseAvailable, prepareRelease } from './releaseCache';
import {
  beginBootAttempt,
  confirmBoot,
  confirmLatestRelease,
  markCandidateReady,
  setAutomaticMode,
} from './stateMachine';

export type RestartReadiness = () => Promise<'ready' | 'busy' | 'unresponsive'>;

export const createReleaseController = ({
  currentRelease,
  store,
  now = () => new Date().toISOString(),
  readiness = () => Promise.resolve('ready'),
}: {
  currentRelease: ReleaseIdentity;
  store: ReleaseControllerStateStore;
  now?: () => string;
  readiness?: RestartReadiness;
}) => {
  const enqueue = createCommandQueue();
  const read = () => store.read(currentRelease);
  const save = async (state: ReleaseControllerState): Promise<AppUpdateOutcome> => {
    await store.write(state);
    return { status: 'ok', state };
  };
  const check = async (): Promise<{ state: ReleaseControllerState; latest: LatestRelease }> => {
    const state = await read();
    const response = await fetch('/updates/latest.json', { cache: 'no-store' });
    if (!response.ok) throw new Error('Latest release request failed.');
    const latest = latestReleaseSchema.parse(await response.json());
    const next = confirmLatestRelease(state, latest.release, now());
    await store.write(next);
    return { state: next, latest };
  };
  const prepareLatest = async (state?: ReleaseControllerState): Promise<AppUpdateOutcome> => {
    const current = state ?? (await read());
    const latest = current.confirmedLatestRelease;
    if (!latest || latest.releaseId === current.failedReleaseId)
      return { status: 'ok', state: current };
    await prepareRelease(latest);
    return save(markCandidateReady(current, latest));
  };

  return {
    execute(commandValue: unknown): Promise<AppUpdateOutcome> {
      return enqueue(async () => {
        if (
          typeof commandValue === 'object' &&
          commandValue !== null &&
          'protocolVersion' in commandValue &&
          commandValue.protocolVersion !== 1
        ) {
          return { status: 'error', code: 'unsupportedProtocol' };
        }
        const parsed = releaseControllerCommandSchema.safeParse(commandValue);
        if (!parsed.success) {
          return { status: 'error', code: 'invalidResponse' };
        }
        const command: ReleaseControllerCommand = parsed.data;
        try {
          switch (command.type) {
            case 'GET_STATE':
              return { status: 'ok', state: await read() };
            case 'CHECK': {
              const { state } = await check();
              return state.mode === 'automatic'
                ? await prepareLatest(state)
                : { status: 'ok', state };
            }
            case 'PREPARE_LATEST':
              return await prepareLatest();
            case 'SET_AUTOMATIC': {
              const state = await read();
              const running = [state.bootAttempt, state.activeRelease, state.pinnedRelease].find(
                (release) => release?.releaseId === command.runningReleaseId,
              );
              if (!running || !(await isReleaseAvailable(running))) {
                return { status: 'error', code: 'prepareFailed', state };
              }
              const next = setAutomaticMode(state, command.enabled, running);
              await store.write(next);
              return command.enabled ? await prepareLatest(next) : { status: 'ok', state: next };
            }
            case 'ACTIVATE': {
              let state = await read();
              const latest = state.confirmedLatestRelease;
              if (!latest) return { status: 'error', code: 'checkFailed', state };
              if (!(await isReleaseAvailable(latest))) {
                await prepareRelease(latest);
                state = markCandidateReady(state, latest);
              }
              const ready = await readiness();
              if (ready !== 'ready') {
                return {
                  status: 'blocked',
                  code: ready === 'busy' ? 'restartBusy' : 'restartUnresponsive',
                  state,
                };
              }
              return await save(beginBootAttempt(state, latest));
            }
            case 'BOOT_OK':
              return await save(confirmBoot(await read(), command.releaseId));
          }
        } catch {
          const state = await read().catch(() => undefined);
          return {
            status: 'error',
            code:
              command.type === 'CHECK'
                ? 'checkFailed'
                : command.type === 'PREPARE_LATEST' || command.type === 'ACTIVATE'
                  ? 'prepareFailed'
                  : 'capabilityUnavailable',
            ...(state && { state }),
          };
        }
      });
    },
  };
};
/* eslint-enable jsdoc/require-jsdoc -- End controller factory contract. */
