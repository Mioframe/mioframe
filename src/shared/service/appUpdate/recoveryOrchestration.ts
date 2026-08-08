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
  isReleasePreparationError,
  reportReleasePreparationFailure,
  ReleasePreparationFailureReason,
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
 * The attempt-local facts one {@link runRecoverInstallLatest} call actually
 * produced, so the caller can decide follow-up work (ordinary release-cache
 * cleanup, a state-changed broadcast) from what this attempt itself did —
 * never from {@link RecoverInstallLatestResultCode} alone, which the same
 * code can report both before and after a release was ever prepared.
 *
 * A release this attempt prepared but could not confirm was adopted (a
 * conflicting/absent/invalid finalization read, or a failed durable write) is
 * deliberately never deleted here: Cache Storage is not lifecycle authority,
 * the cache cannot become active without valid persisted state, and it can be
 * reused by a later retry or reclaimed by ordinary release-cache cleanup once
 * it is genuinely unowned by fresh state.
 */
export type RecoverInstallLatestOutcome = {
  /** The classified result code for this attempt. */
  result: RecoverInstallLatestResultCode;
  /** Whether this attempt itself durably wrote controller state. */
  stateChanged: boolean;
};

/**
 * Classifies a failure from fetching/validating `latest.json` or its exact
 * descriptor (the "fetch and validate latest" step, common to both recovery
 * flows) into its {@link RecoverInstallLatestResultCode}.
 * @param error - The raw thrown value.
 * @returns The classified result code.
 */
function classifyDiscoveryFailure(error: unknown): RecoverInstallLatestResultCode {
  if (
    isReleasePreparationError(error) &&
    error.code === ReleasePreparationFailureReason.INVALID_ARCHIVE_METADATA
  ) {
    return 'invalid-latest-metadata';
  }
  return 'network-or-latest-unavailable';
}

/**
 * Fetches and validates `latest.json` and its exact descriptor, outside any
 * lock — shared by both recovery flows' first network step. Reports its own
 * failure once here, at the same classified boundary preparation failures
 * use, before either caller classifies it into a
 * {@link RecoverInstallLatestResultCode} — never reported twice, since a
 * later `coordinator.prepare()` failure in the same attempt owns its own
 * failures separately.
 * @param channelBasePath - This worker's channel base path.
 * @returns The validated exact descriptor.
 * @throws {DomainError} When the fetch or validation fails.
 */
async function fetchValidatedLatestDescriptor(channelBasePath: string): Promise<ReleaseDescriptor> {
  try {
    const pointer = await fetchLatestReleasePointer(channelBasePath);
    return await fetchReleaseDescriptor(channelBasePath, pointer);
  } catch (error) {
    reportReleasePreparationFailure(error);
    throw error;
  }
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
 * @returns The classified {@link RecoverInstallLatestOutcome}.
 */
async function runStateLossRecovery(
  dependencies: RecoveryOrchestrationDependencies,
): Promise<RecoverInstallLatestOutcome> {
  const { channel, channelBasePath, enqueue, coordinator } = dependencies;

  let descriptor: ReleaseDescriptor;
  try {
    descriptor = await fetchValidatedLatestDescriptor(channelBasePath);
  } catch (error) {
    return { result: classifyDiscoveryFailure(error), stateChanged: false };
  }

  const preparedLatest = toReleaseSummary(descriptor);
  try {
    await coordinator.prepare(channel, channelBasePath, preparedLatest, descriptor);
  } catch {
    return { result: 'release-preparation-failed', stateChanged: false };
  }

  return enqueue(async (): Promise<RecoverInstallLatestOutcome> => {
    const fresh = await readControllerState(channel);
    if (fresh.status === 'storage-unavailable') {
      // Preparation already succeeded, but finalization cannot confirm
      // whether preparedLatest was adopted: fails closed rather than
      // claiming it unowned.
      return { result: 'controller-storage-unavailable', stateChanged: false };
    }

    if (fresh.status === 'valid') {
      // Another window's own recovery (or an otherwise concurrent write)
      // already landed a valid state — never overwritten. Exactly the same
      // outcome this attempt would itself have produced is an idempotent
      // success; anything else asks the page to reload and reclassify.
      return releaseSummariesMatch(fresh.state.activeRelease, preparedLatest) &&
        !fresh.state.candidate
        ? { result: 'success', stateChanged: false }
        : { result: 'state-changed', stateChanged: false };
    }

    // Still absent or invalid: the record is untouched until this exact
    // point, and is only ever replaced by a brand-new Automatic baseline —
    // no candidate, no guessed previous release, no retained previous mode.
    try {
      await writeControllerState(channel, buildInitialControllerState(preparedLatest));
    } catch {
      return { result: 'controller-state-persistence-failed', stateChanged: false };
    }
    return { result: 'success', stateChanged: true };
  });
}

/**
 * One classification of `latest` against a *fresh* controller-state read,
 * decided entirely from that read plus `latest` — never from any state read
 * before the network request that produced `latest` (see
 * {@link classifyKnownActive}).
 */
type KnownActiveClassification =
  | { kind: 'final'; result: RecoverInstallLatestResultCode }
  | { kind: 'reprepare-active'; active: ReleaseSummary }
  | { kind: 'stage-candidate'; active: ReleaseSummary };

/**
 * Classifies exact latest `latest` against a *fresh* controller state,
 * deciding known-active recovery's outcome without touching the network or
 * Cache Storage (see the managed pinned application updates architecture,
 * "Recovery when active release is known but unavailable"). Called once
 * right after a fresh state re-read, inside a short `OperationQueue`
 * section, and again — against another fresh read — after preparation, so
 * every decision this function can produce is always based on state no
 * older than the moment it ran.
 *
 * Deliberately also classifies against the fresh pinned candidate for the
 * newer-`latest` case: a pre-existing `ready`/`activating` candidate that
 * already conflicts with `latest`, or an `available`/`failed` one already
 * newer than or conflicting with `latest`, is decided here — before
 * preparation ever starts — so recovery never fully downloads and verifies
 * `latest` only to discover it can never be staged.
 * @param state - A freshly re-read valid controller state.
 * @param latest - The validated exact latest release.
 * @returns The classified outcome.
 */
function classifyKnownActive(
  state: UpdateControllerState,
  latest: ReleaseSummary,
): KnownActiveClassification {
  const active = state.activeRelease;

  if (latest.releaseNumber < active.releaseNumber) {
    return { kind: 'final', result: 'latest-older-than-active' };
  }
  if (latest.releaseNumber === active.releaseNumber && !releaseSummariesMatch(latest, active)) {
    return { kind: 'final', result: 'conflicting-release-identity' };
  }
  if (releaseSummariesMatch(latest, active)) {
    return { kind: 'reprepare-active', active };
  }

  const { candidate } = state;
  if (candidate?.phase === 'ready' || candidate?.phase === 'activating') {
    // Pinned: never superseded. An exact match is an idempotent success —
    // this recovery's own target is already exactly what is pinned.
    return {
      kind: 'final',
      result: releaseSummariesMatch(candidate.release, latest) ? 'success' : 'state-changed',
    };
  }
  // Any remaining candidate here is necessarily `available` or `failed`:
  // `ready`/`activating` already returned above.
  if (candidate) {
    if (candidate.release.releaseNumber === latest.releaseNumber) {
      if (!releaseSummariesMatch(candidate.release, latest)) {
        return { kind: 'final', result: 'conflicting-release-identity' };
      }
      // Exact match: fall through to idempotently stage it.
    } else if (candidate.release.releaseNumber > latest.releaseNumber) {
      // An existing candidate already newer than latest supersedes this
      // recovery's target; never replace it with something older.
      return { kind: 'final', result: 'state-changed' };
    }
  }

  return { kind: 'stage-candidate', active };
}

/**
 * Runs known-active recovery (see the managed pinned application updates
 * architecture, "Recovery when active release is known but unavailable"):
 * applies when fresh state was `valid` at the moment {@link runRecoverInstallLatest}
 * was invoked. Never replaces the active release directly — an exact match
 * with the latest published release only re-prepares it, and a strictly
 * newer latest is only ever staged as a `ready` candidate for the existing
 * clean-launch/`BOOT_OK` lifecycle.
 *
 * Fetches and validates latest entirely outside {@link OperationQueue}, then
 * enters one short queued section that re-reads fresh state and classifies
 * latest against it (see {@link classifyKnownActive}) before leaving the
 * queue again for preparation — so `latest-older-than-active` and
 * `conflicting-release-identity` are always decided from state no older
 * than the network round trip that produced `latest`, never from a stale
 * snapshot read before it.
 * @param dependencies - Worker-owned recovery dependencies.
 * @returns The classified {@link RecoverInstallLatestOutcome}.
 */
async function runKnownActiveRecovery(
  dependencies: RecoveryOrchestrationDependencies,
): Promise<RecoverInstallLatestOutcome> {
  const { channel, enqueue } = dependencies;

  let latestDescriptor: ReleaseDescriptor;
  try {
    latestDescriptor = await fetchValidatedLatestDescriptor(dependencies.channelBasePath);
  } catch (error) {
    return { result: classifyDiscoveryFailure(error), stateChanged: false };
  }
  const latest = toReleaseSummary(latestDescriptor);

  const classification = await enqueue(async (): Promise<KnownActiveClassification> => {
    const fresh = await readControllerState(channel);
    if (fresh.status === 'storage-unavailable') {
      return { kind: 'final', result: 'controller-storage-unavailable' };
    }
    if (fresh.status !== 'valid') return { kind: 'final', result: 'state-changed' };
    return classifyKnownActive(fresh.state, latest);
  });

  if (classification.kind === 'final') {
    // Every 'final' classification is decided before preparation ever
    // starts: no target can have been left unowned.
    return { result: classification.result, stateChanged: false };
  }
  if (classification.kind === 'reprepare-active') {
    return runReprepareExactActive(dependencies, classification.active, latestDescriptor);
  }
  return runStageNewerCandidate(dependencies, classification.active, latest, latestDescriptor);
}

/**
 * Latest exactly matched active `A` at the moment {@link classifyKnownActive}
 * decided this (already against a fresh read): fully re-prepares `A` and
 * re-confirms `A` is still active — against another fresh read — before
 * letting the page reload into the ordinary fetch-serving path. Never
 * changes lifecycle state.
 * @param dependencies - Worker-owned recovery dependencies.
 * @param activeAtClassification - The exact active release {@link classifyKnownActive} matched against.
 * @param descriptor - The validated latest descriptor, already proven to match `activeAtClassification`.
 * @returns The classified {@link RecoverInstallLatestOutcome}.
 */
async function runReprepareExactActive(
  dependencies: RecoveryOrchestrationDependencies,
  activeAtClassification: ReleaseSummary,
  descriptor: ReleaseDescriptor,
): Promise<RecoverInstallLatestOutcome> {
  const { channel, channelBasePath, enqueue, coordinator } = dependencies;

  try {
    await coordinator.prepare(channel, channelBasePath, activeAtClassification, descriptor);
  } catch {
    return { result: 'release-preparation-failed', stateChanged: false };
  }

  return enqueue(async (): Promise<RecoverInstallLatestOutcome> => {
    const fresh = await readControllerState(channel);
    if (fresh.status === 'storage-unavailable') {
      // Fails closed: never claims the just-reprepared cache is unowned
      // when finalization itself cannot confirm anything.
      return { result: 'controller-storage-unavailable', stateChanged: false };
    }
    if (fresh.status !== 'valid') {
      return { result: 'state-changed', stateChanged: false };
    }
    if (!releaseSummariesMatch(fresh.state.activeRelease, activeAtClassification)) {
      return { result: 'state-changed', stateChanged: false };
    }
    // No write: activeRelease and every other field are left completely
    // untouched. The page's own reload re-validates the now-prepared cache.
    return { result: 'success', stateChanged: false };
  });
}

/**
 * Latest `B` was strictly newer than active `A` at the moment
 * {@link classifyKnownActive} decided this (already against a fresh read):
 * fully prepares exact `B`, then — against another fresh read — stages it as
 * `ready(B)` only when doing so still cannot supersede a pinned
 * `ready`/`activating` candidate or replace a newer/conflicting
 * `available`/`failed` one. Never makes `B` active directly. Re-derives the
 * complete classification from this second fresh read rather than trusting
 * the first, since either the active release or the candidate may have
 * changed again during preparation's network/Cache Storage work.
 * @param dependencies - Worker-owned recovery dependencies.
 * @param activeAtClassification - The exact active release {@link classifyKnownActive} matched against.
 * @param latest - The exact newer latest release.
 * @param descriptor - The validated latest descriptor, already proven to match `latest`.
 * @returns The classified {@link RecoverInstallLatestOutcome}.
 */
async function runStageNewerCandidate(
  dependencies: RecoveryOrchestrationDependencies,
  activeAtClassification: ReleaseSummary,
  latest: ReleaseSummary,
  descriptor: ReleaseDescriptor,
): Promise<RecoverInstallLatestOutcome> {
  const { channel, channelBasePath, enqueue, coordinator } = dependencies;

  try {
    await coordinator.prepare(channel, channelBasePath, latest, descriptor);
  } catch {
    return { result: 'release-preparation-failed', stateChanged: false };
  }

  return enqueue(async (): Promise<RecoverInstallLatestOutcome> => {
    const fresh = await readControllerState(channel);
    if (fresh.status === 'storage-unavailable') {
      // Fails closed: never claims the just-prepared latest is unowned when
      // finalization itself cannot confirm anything.
      return { result: 'controller-storage-unavailable', stateChanged: false };
    }
    if (fresh.status !== 'valid') {
      return { result: 'state-changed', stateChanged: false };
    }
    const state = fresh.state;
    if (!releaseSummariesMatch(state.activeRelease, activeAtClassification)) {
      return { result: 'state-changed', stateChanged: false };
    }

    const { candidate } = state;
    if (candidate?.phase === 'ready' || candidate?.phase === 'activating') {
      // Pinned: never superseded. An exact match is an idempotent success —
      // this recovery's own target is already exactly what is pinned.
      return releaseSummariesMatch(candidate.release, latest)
        ? { result: 'success', stateChanged: false }
        : { result: 'state-changed', stateChanged: false };
    }
    // Any remaining candidate here is necessarily `available` or `failed`:
    // `ready`/`activating` already returned above.
    if (candidate) {
      if (candidate.release.releaseNumber === latest.releaseNumber) {
        if (!releaseSummariesMatch(candidate.release, latest)) {
          return { result: 'conflicting-release-identity', stateChanged: false };
        }
        // Exact match: fall through to idempotently mark it ready.
      } else if (candidate.release.releaseNumber > latest.releaseNumber) {
        // An existing candidate already newer than B supersedes this
        // recovery's target; never replace it with something older.
        return { result: 'state-changed', stateChanged: false };
      }
    }

    const next: UpdateControllerState = {
      ...state,
      candidate: { phase: 'ready', release: latest },
    };
    try {
      await writeControllerState(channel, next);
    } catch {
      return { result: 'controller-state-persistence-failed', stateChanged: false };
    }
    return { result: 'success', stateChanged: true };
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
 * {@link runStateLossRecovery}; `valid` runs {@link runKnownActiveRecovery},
 * which re-reads and classifies fresh state again itself after the network
 * round trip that fetches latest, rather than trusting this dispatch-time
 * read for its own classification. A storage read failure fails closed
 * immediately, before selecting any release.
 * @param dependencies - Worker-owned recovery dependencies.
 * @returns The classified {@link RecoverInstallLatestOutcome}.
 */
export async function runRecoverInstallLatest(
  dependencies: RecoveryOrchestrationDependencies,
): Promise<RecoverInstallLatestOutcome> {
  const { channel, enqueue } = dependencies;

  const initialRead = await enqueue(() => readControllerState(channel));
  if (initialRead.status === 'storage-unavailable') {
    return { result: 'controller-storage-unavailable', stateChanged: false };
  }

  if (initialRead.status === 'valid') {
    return runKnownActiveRecovery(dependencies);
  }
  return runStateLossRecovery(dependencies);
}
