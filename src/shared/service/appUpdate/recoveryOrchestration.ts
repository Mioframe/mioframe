import {
  releaseSummariesMatch,
  toReleaseSummary,
  type ManagedChannel,
  type ReleaseDescriptor,
  type ReleaseSummary,
  type UpdateControllerState,
} from './contracts';
import { readControllerState, writeControllerState } from './controllerState';
import type { OperationQueue } from './operationQueue';
import type { PreparationCoordinator } from './preparationCoordinator';
import type { RecoverInstallLatestResultCode } from './protocol';
import {
  fetchLatestReleasePointer,
  fetchReleaseDescriptor,
  ReleasePreparationError,
} from './releasePreparation';
import { buildInitialControllerState } from './stateTransitions';

/** Worker-owned dependencies one recovery attempt needs. */
export type RecoveryOrchestrationDependencies = {
  /** Managed channel. */
  channel: ManagedChannel;
  /** This worker's channel base path. */
  channelBasePath: string;
  /** The channel's short serialized state-lock queue. */
  enqueue: OperationQueue;
  /** The channel's exact-identity preparation and cleanup coordinator. */
  coordinator: PreparationCoordinator;
};

/**
 * Classifies a failure from fetching/validating `latest.json` or its exact
 * descriptor (the "fetch and validate latest" step, common to both recovery
 * flows) into its {@link RecoverInstallLatestResultCode}.
 * @param error - The raw thrown value.
 * @returns The classified result code.
 */
function classifyDiscoveryFailure(error: unknown): RecoverInstallLatestResultCode {
  if (error instanceof ReleasePreparationError && error.reason === 'INVALID_ARCHIVE_METADATA') {
    return 'invalid-latest-metadata';
  }
  return 'network-or-latest-unavailable';
}

/**
 * Fetches and validates `latest.json` and its exact descriptor, outside any
 * lock — shared by both recovery flows' first network step.
 * @param channelBasePath - This worker's channel base path.
 * @returns The validated exact descriptor.
 * @throws {ReleasePreparationError} When the fetch or validation fails.
 */
async function fetchValidatedLatestDescriptor(channelBasePath: string): Promise<ReleaseDescriptor> {
  const pointer = await fetchLatestReleasePointer(channelBasePath);
  return fetchReleaseDescriptor(channelBasePath, pointer);
}

/**
 * Runs state-loss recovery (see the managed pinned application updates
 * architecture, "Recovery when controller state is lost"): applies when
 * fresh state was `absent` or `invalid` at the moment {@link runRecoverInstallLatest}
 * was invoked. Fetches, validates, and fully prepares exact latest entirely
 * outside {@link OperationQueue}, then finalizes in one short serialized
 * step that re-reads fresh state and only ever writes a brand-new Automatic
 * baseline — never a guessed or retained previous mode/candidate.
 * @param dependencies - Worker-owned recovery dependencies.
 * @returns The classified result code.
 */
async function runStateLossRecovery(
  dependencies: RecoveryOrchestrationDependencies,
): Promise<RecoverInstallLatestResultCode> {
  const { channel, channelBasePath, enqueue, coordinator } = dependencies;

  let descriptor: ReleaseDescriptor;
  try {
    descriptor = await fetchValidatedLatestDescriptor(channelBasePath);
  } catch (error) {
    return classifyDiscoveryFailure(error);
  }

  const preparedLatest = toReleaseSummary(descriptor);
  try {
    await coordinator.prepare(channel, channelBasePath, preparedLatest, descriptor);
  } catch {
    return 'release-preparation-failed';
  }

  return enqueue(async () => {
    const fresh = await readControllerState(channel);
    if (fresh.status === 'storage-unavailable') return 'controller-storage-unavailable';

    if (fresh.status === 'valid') {
      // Another window's own recovery (or an otherwise concurrent write)
      // already landed a valid state — never overwritten. Exactly the same
      // outcome this attempt would itself have produced is an idempotent
      // success; anything else asks the page to reload and reclassify.
      return releaseSummariesMatch(fresh.state.activeRelease, preparedLatest) &&
        !fresh.state.candidate
        ? 'success'
        : 'state-changed';
    }

    // Still absent or invalid: the record is untouched until this exact
    // point, and is only ever replaced by a brand-new Automatic baseline —
    // no candidate, no guessed previous release, no retained previous mode.
    try {
      await writeControllerState(channel, buildInitialControllerState(preparedLatest));
    } catch {
      return 'controller-state-persistence-failed';
    }
    return 'success';
  });
}

/**
 * Runs known-active recovery (see the managed pinned application updates
 * architecture, "Recovery when active release is known but unavailable"):
 * applies when fresh state was `valid` at the moment {@link runRecoverInstallLatest}
 * was invoked, identifying exact active release `A`. Never replaces `A`
 * directly — an exact match with the latest published release only
 * re-prepares `A`, and a strictly newer latest `B` is only ever staged as a
 * `ready` candidate for the existing clean-launch/`BOOT_OK` lifecycle.
 * @param dependencies - Worker-owned recovery dependencies.
 * @param stateAtStart - The fresh valid controller state read just before this flow was chosen.
 * @returns The classified result code.
 */
async function runKnownActiveRecovery(
  dependencies: RecoveryOrchestrationDependencies,
  stateAtStart: UpdateControllerState,
): Promise<RecoverInstallLatestResultCode> {
  const { channel, channelBasePath, enqueue, coordinator } = dependencies;
  const activeAtStart = stateAtStart.activeRelease;

  let latestDescriptor: ReleaseDescriptor;
  try {
    latestDescriptor = await fetchValidatedLatestDescriptor(channelBasePath);
  } catch (error) {
    return classifyDiscoveryFailure(error);
  }
  const latest = toReleaseSummary(latestDescriptor);

  if (latest.releaseNumber < activeAtStart.releaseNumber) return 'latest-older-than-active';
  if (
    latest.releaseNumber === activeAtStart.releaseNumber &&
    !releaseSummariesMatch(latest, activeAtStart)
  ) {
    return 'conflicting-release-identity';
  }

  if (releaseSummariesMatch(latest, activeAtStart)) {
    return runReprepareExactActive(dependencies, activeAtStart, latestDescriptor);
  }
  return runStageNewerCandidate(
    { channel, channelBasePath, enqueue, coordinator },
    activeAtStart,
    latest,
    latestDescriptor,
  );
}

/**
 * Latest exactly matches active `A`: fully re-prepares `A` and confirms
 * `A` is still active before letting the page reload into the ordinary
 * fetch-serving path — never changes lifecycle state.
 * @param dependencies - Worker-owned recovery dependencies.
 * @param activeAtStart - The exact active release identified when recovery began.
 * @param descriptor - The validated latest descriptor, already proven to match `activeAtStart`.
 * @returns The classified result code.
 */
async function runReprepareExactActive(
  dependencies: RecoveryOrchestrationDependencies,
  activeAtStart: ReleaseSummary,
  descriptor: ReleaseDescriptor,
): Promise<RecoverInstallLatestResultCode> {
  const { channel, channelBasePath, enqueue, coordinator } = dependencies;

  try {
    await coordinator.prepare(channel, channelBasePath, activeAtStart, descriptor);
  } catch {
    return 'release-preparation-failed';
  }

  return enqueue(async () => {
    const fresh = await readControllerState(channel);
    if (fresh.status === 'storage-unavailable') return 'controller-storage-unavailable';
    if (fresh.status !== 'valid') return 'state-changed';
    if (!releaseSummariesMatch(fresh.state.activeRelease, activeAtStart)) return 'state-changed';
    // No write: activeRelease and every other field are left completely
    // untouched. The page's own reload re-validates the now-prepared cache.
    return 'success';
  });
}

/**
 * Latest `B` is strictly newer than active `A`: fully prepares exact `B`,
 * then stages it as `ready(B)` only when doing so cannot supersede a pinned
 * `ready`/`activating` candidate or replace a newer/conflicting
 * `available`/`failed` one. Never makes `B` active directly.
 * @param dependencies - Worker-owned recovery dependencies.
 * @param activeAtStart - The exact active release identified when recovery began.
 * @param latest - The exact newer latest release.
 * @param descriptor - The validated latest descriptor, already proven to match `latest`.
 * @returns The classified result code.
 */
async function runStageNewerCandidate(
  dependencies: RecoveryOrchestrationDependencies,
  activeAtStart: ReleaseSummary,
  latest: ReleaseSummary,
  descriptor: ReleaseDescriptor,
): Promise<RecoverInstallLatestResultCode> {
  const { channel, channelBasePath, enqueue, coordinator } = dependencies;

  try {
    await coordinator.prepare(channel, channelBasePath, latest, descriptor);
  } catch {
    return 'release-preparation-failed';
  }

  return enqueue(async () => {
    const fresh = await readControllerState(channel);
    if (fresh.status === 'storage-unavailable') return 'controller-storage-unavailable';
    if (fresh.status !== 'valid') return 'state-changed';
    const state = fresh.state;
    if (!releaseSummariesMatch(state.activeRelease, activeAtStart)) return 'state-changed';

    const { candidate } = state;
    if (candidate?.phase === 'ready' || candidate?.phase === 'activating') {
      // Pinned: never superseded. An exact match is an idempotent success —
      // this recovery's own target is already exactly what is pinned.
      return releaseSummariesMatch(candidate.release, latest) ? 'success' : 'state-changed';
    }
    // Any remaining candidate here is necessarily `available` or `failed`:
    // `ready`/`activating` already returned above.
    if (candidate) {
      if (candidate.release.releaseNumber === latest.releaseNumber) {
        if (!releaseSummariesMatch(candidate.release, latest))
          return 'conflicting-release-identity';
        // Exact match: fall through to idempotently mark it ready.
      } else if (candidate.release.releaseNumber > latest.releaseNumber) {
        // An existing candidate already newer than B supersedes this
        // recovery's target; never replace it with something older.
        return 'state-changed';
      }
    }

    const next: UpdateControllerState = {
      ...state,
      candidate: { phase: 'ready', release: latest },
    };
    try {
      await writeControllerState(channel, next);
    } catch {
      return 'controller-state-persistence-failed';
    }
    return 'success';
  });
}

/**
 * Runs one explicit `RECOVER_INSTALL_LATEST` recovery attempt (see the
 * managed pinned application updates architecture, "Recovery protocol and
 * timeout"). Not a manager, scheduler, registry, or second lifecycle: a
 * single focused attempt, safe to call repeatedly (retries, concurrent
 * windows, a client-side timeout that never cancels this attempt) because
 * every finalization re-reads fresh state and is itself idempotent.
 *
 * Dispatches by fresh state at the moment this is called — never by the
 * caller's own possibly-stale snapshot: `absent`/`invalid` runs
 * {@link runStateLossRecovery}; `valid` runs {@link runKnownActiveRecovery}
 * against that exact fresh active release. A storage read failure fails
 * closed immediately, before selecting any release.
 * @param dependencies - Worker-owned recovery dependencies.
 * @returns The classified {@link RecoverInstallLatestResultCode}.
 */
export async function runRecoverInstallLatest(
  dependencies: RecoveryOrchestrationDependencies,
): Promise<RecoverInstallLatestResultCode> {
  const { channel, enqueue } = dependencies;

  const initialRead = await enqueue(() => readControllerState(channel));
  if (initialRead.status === 'storage-unavailable') return 'controller-storage-unavailable';

  if (initialRead.status === 'valid') {
    return runKnownActiveRecovery(dependencies, initialRead.state);
  }
  return runStateLossRecovery(dependencies);
}
