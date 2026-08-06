import { buildControllerStateDbName } from './controllerState';
import type { ManagedChannel } from './contracts';

/**
 * Every top-level classification the worker-generated recovery page may
 * report (see the managed pinned application updates architecture,
 * "Recovery classifications"). `UPDATE_STATE_INVALID` and
 * `ACTIVE_RELEASE_UNAVAILABLE` each carry a further stable `problemDetail`
 * (a {@link import('./controllerState').ControllerStateInvalidReason} or a
 * {@link import('./releasePreparation').ReleasePreparationFailureReason}
 * respectively).
 */
export const RECOVERY_PROBLEM_CODES = [
  'UPDATE_STATE_ABSENT',
  'UPDATE_STATE_INVALID',
  'UPDATE_STORAGE_UNAVAILABLE',
  'ACTIVE_RELEASE_UNAVAILABLE',
] as const;
/** One of {@link RECOVERY_PROBLEM_CODES}. */
export type RecoveryProblemCode = (typeof RECOVERY_PROBLEM_CODES)[number];

/**
 * The complete, safe diagnostic model the recovery page may render or copy.
 * Every field here is on the architecture's allowlist; nothing else (raw
 * persisted state, raw exceptions, cache keys, local paths, tokens, or user
 * content) may ever reach this shape.
 */
export type RecoveryDiagnostics = {
  /** The top-level recovery classification. */
  problemCode: RecoveryProblemCode;
  /** A further stable sub-reason, when the problem code carries one. */
  problemDetail?: string;
  /** This worker's managed channel. */
  channel: ManagedChannel;
  /** This channel's persisted-state IndexedDB database name. */
  controllerDatabaseName: string;
  /** The known active/candidate release number, when the failure identifies one. */
  selectedReleaseNumber?: number;
  /** ISO timestamp this diagnostic snapshot was built. */
  timestamp: string;
  /** An allowlisted browser storage error name, when one is available. */
  errorName?: string;
};

/** Inputs to {@link buildRecoveryDiagnostics}. */
export type BuildRecoveryDiagnosticsInput = {
  channel: ManagedChannel;
  problemCode: RecoveryProblemCode;
  problemDetail?: string;
  selectedReleaseNumber?: number;
  errorName?: string;
  /** Injectable clock, for deterministic tests. Defaults to the current time. */
  now?: () => string;
};

/**
 * Builds the complete safe {@link RecoveryDiagnostics} model for one recovery
 * page render. The single point that derives `controllerDatabaseName` and
 * `timestamp`, so every recovery page render and every recovery response
 * shares the exact same allowlisted-field construction.
 * @param input - The classified problem and known safe context.
 * @returns The complete diagnostic model.
 */
export function buildRecoveryDiagnostics(
  input: BuildRecoveryDiagnosticsInput,
): RecoveryDiagnostics {
  const timestamp = (input.now ?? (() => new Date().toISOString()))();
  const diagnostics: RecoveryDiagnostics = {
    problemCode: input.problemCode,
    channel: input.channel,
    controllerDatabaseName: buildControllerStateDbName(input.channel),
    timestamp,
  };
  if (input.problemDetail !== undefined) diagnostics.problemDetail = input.problemDetail;
  if (input.selectedReleaseNumber !== undefined) {
    diagnostics.selectedReleaseNumber = input.selectedReleaseNumber;
  }
  if (input.errorName !== undefined) diagnostics.errorName = input.errorName;
  return diagnostics;
}

/**
 * Escapes `value` for safe inclusion in HTML text or attribute content. The
 * single point every diagnostic value passes through before it can reach the
 * generated recovery page markup — every caller must route through this
 * rather than interpolating raw text.
 * @param value - Raw text to escape.
 * @returns HTML-safe text.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Serializes `diagnostics` as JSON safe to embed inside an inline
 * `<script type="application/json">` element: escapes `<` so a value
 * containing the literal text `</script` can never terminate the
 * surrounding tag early, matching the standard mitigation for embedding
 * untrusted JSON in HTML.
 * @param diagnostics - The diagnostic model to serialize.
 * @returns JSON text safe to place inside a `<script>` element's body.
 */
export function serializeDiagnosticsForEmbedding(diagnostics: RecoveryDiagnostics): string {
  return JSON.stringify(diagnostics).replace(/</g, '\\u003C');
}
