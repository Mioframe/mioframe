import {
  DiagnosticClassification,
  DiagnosticResult,
  DiagnosticSeverity,
  reportDiagnosticEvent,
} from '@shared/lib/diagnostics';
import type { ManagedChannel } from './contracts';
import type { RecoveryProblemCode } from './recoveryDiagnostics';

/**
 * Stable, project-controlled classification of which existing activation
 * outcome triggered a durably committed rollback. A small fixed set derived
 * from the classifications `stateTransitions.ts`/`workerFetch.ts` already
 * produce — never a raw error message or free-form string.
 */
export const ACTIVATION_ROLLBACK_TRIGGERS = [
  /** An explicit watchdog `BOOT_FAILED` report for the activating candidate. */
  'bootFailed',
  /** A `BOOT_OK` report arrived after the activation deadline had already expired. */
  'bootOkExpired',
  /** A navigation observed a pre-existing `activating` candidate past its deadline. */
  'activationDeadlineExpired',
  /** Serving the activating candidate's own release itself failed or returned 503. */
  'activationServeFailed',
] as const;
/** One of {@link ACTIVATION_ROLLBACK_TRIGGERS}. */
export type ActivationRollbackTrigger = (typeof ACTIVATION_ROLLBACK_TRIGGERS)[number];

/**
 * Reports `appUpdate.activationRolledBack` once an activation rollback has
 * actually been durably committed to persisted controller state.
 *
 * Call only after the write succeeds — never merely because rollback
 * evaluation started, and never for an idempotent no-write outcome (a stale
 * window re-reporting a rollback that already happened).
 * @param channel - Managed channel.
 * @param trigger - Which existing activation outcome triggered this rollback.
 * @param managedReleaseNumber - The release number that failed to activate.
 */
export function reportActivationRolledBack(
  channel: ManagedChannel,
  trigger: ActivationRollbackTrigger,
  managedReleaseNumber: number,
): void {
  reportDiagnosticEvent({
    name: 'appUpdate.activationRolledBack',
    severity: DiagnosticSeverity.Warning,
    result: DiagnosticResult.Failed,
    classification: DiagnosticClassification.Consistency,
    safeTags: { channel, trigger, managedReleaseNumber: String(managedReleaseNumber) },
  });
}

/**
 * Reports `appUpdate.recoveryRequired` when a top-level navigation is
 * actually being served the worker-generated recovery experience.
 *
 * Call only at the boundary that already decided to serve the recovery page
 * to a real navigation — never merely because a non-`'valid'` controller
 * state or an unavailable active release was observed during an otherwise
 * expected initialization or classification path. Never serializes the
 * complete `RecoveryDiagnostics` object — only the safe, already-closed
 * `problemCode` classification.
 * @param channel - Managed channel.
 * @param problemCode - The safe recovery classification the recovery page itself renders.
 */
export function reportRecoveryRequired(
  channel: ManagedChannel,
  problemCode: RecoveryProblemCode,
): void {
  reportDiagnosticEvent({
    name: 'appUpdate.recoveryRequired',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification: DiagnosticClassification.Consistency,
    safeTags: { channel, problemCode },
  });
}

/**
 * Reports `appUpdate.discoveryIdentityConflict` when a discovered release
 * shares `known`'s `releaseNumber` but conflicts on `appVersion`, `buildId`,
 * or `buildDate` (see `applyDiscovery`'s `identity-conflict` outcome in
 * `./stateTransitions`) — a fail-closed invariant violation, never an
 * ordinary stale or successful discovery. Never serializes the conflicting
 * `appVersion`/`buildId`/`buildDate` values themselves — only the safe
 * `releaseNumber` they collided on.
 * @param channel - Managed channel.
 * @param releaseNumber - The release number the conflicting discovery shared with `known`.
 */
export function reportDiscoveryIdentityConflict(
  channel: ManagedChannel,
  releaseNumber: number,
): void {
  reportDiagnosticEvent({
    name: 'appUpdate.discoveryIdentityConflict',
    severity: DiagnosticSeverity.Error,
    result: DiagnosticResult.Failed,
    classification: DiagnosticClassification.Consistency,
    safeTags: { channel, releaseNumber: String(releaseNumber) },
  });
}
