import type { AppUpdateSnapshot } from './publicContracts';
import { z } from 'zod';
import type { ReleaseControllerState, ReleaseIdentity } from './contracts';
import { RELEASE_CONTROLLER_SCHEMA_VERSION } from './contracts';

/**
 * Compare immutable releases using only publisher sequence.
 * @param candidate - Validated possible forward release.
 * @param running - Currently committed release.
 * @returns Whether the candidate is strictly forward.
 */
export const isStrictlyNewerRelease = (
  candidate: ReleaseIdentity | undefined,
  running: ReleaseIdentity,
): candidate is ReleaseIdentity =>
  candidate !== undefined && candidate.releaseSequence > running.releaseSequence;

/**
 * Create initial Automatic state only when no durable record exists.
 * @param release - Release currently served by the stable worker.
 * @returns Initial private controller state.
 */
export const createInitialReleaseControllerState = (
  release: ReleaseIdentity,
): ReleaseControllerState => ({
  schemaVersion: RELEASE_CONTROLLER_SCHEMA_VERSION,
  mode: 'automatic',
  activeRelease: release,
  failedReleaseIds: [],
  checkState: 'notChecked',
  preparationState: 'idle',
  activationState: 'idle',
});

/**
 * Explicitly migrate the supported previous controller schema.
 * @param value - Stored previous-schema candidate.
 * @param currentRelease - Currently served release used for safe identity recovery.
 * @returns Migrated state, or undefined when safe migration is impossible.
 */
export const migrateReleaseControllerState = (
  value: unknown,
  currentRelease: ReleaseIdentity,
): ReleaseControllerState | undefined => {
  const parsed = z
    .object({
      schemaVersion: z.literal(1),
      mode: z.enum(['automatic', 'manual']),
      activeRelease: z.object({ releaseId: z.string() }),
      pinnedRelease: z.object({ releaseId: z.string() }).optional(),
    })
    .safeParse(value);
  if (!parsed.success) return undefined;
  const record = parsed.data;
  if (record.activeRelease.releaseId !== currentRelease.releaseId) return undefined;
  if (record.mode === 'manual' && record.pinnedRelease?.releaseId !== currentRelease.releaseId)
    return undefined;
  return {
    ...createInitialReleaseControllerState(currentRelease),
    mode: record.mode === 'manual' ? 'manual' : 'automatic',
    pinnedRelease: record.mode === 'manual' ? currentRelease : undefined,
  };
};

/**
 * Project private controller state into the factual UI-safe snapshot.
 * @param state - Private durable controller state.
 * @param runningRelease - Release executing in the requesting client.
 * @returns UI-safe factual snapshot.
 */
export const projectAppUpdateSnapshot = (
  state: ReleaseControllerState,
  runningRelease = state.pinnedRelease ?? state.activeRelease,
): AppUpdateSnapshot => ({
  capability: state.capabilityUnavailable ? 'unavailable' : 'available',
  mode: state.mode,
  runningRelease,
  ...(state.pinnedRelease && { pinnedRelease: state.pinnedRelease }),
  ...(state.confirmedLatestRelease && { latestRelease: state.confirmedLatestRelease }),
  checkState: state.checkState,
  preparationState: state.preparationState,
  activationState: state.activationState,
  ...(state.lastSuccessfulCheckAt && { lastSuccessfulCheckAt: state.lastSuccessfulCheckAt }),
  ...(state.errorCode && { errorCode: state.errorCode }),
});
