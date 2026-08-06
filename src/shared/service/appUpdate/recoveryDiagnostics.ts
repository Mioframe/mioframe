import * as z from 'zod/v4-mini';
import {
  ALLOWLISTED_STORAGE_ERROR_NAMES,
  buildControllerStateDbName,
  CONTROLLER_STATE_INVALID_REASONS,
  type ControllerStateInvalidReason,
  type StorageErrorName,
} from './controllerState';
import { isPositiveSafeInteger, zodManagedChannel, type ManagedChannel } from './contracts';
import {
  RELEASE_PREPARATION_FAILURE_REASONS,
  type ReleasePreparationFailureReason,
} from './releasePreparation';

/**
 * Every top-level classification the worker-generated recovery page may
 * report (see the managed pinned application updates architecture,
 * "Recovery classifications"). `UPDATE_STATE_INVALID` and
 * `ACTIVE_RELEASE_UNAVAILABLE` each carry a further stable `problemDetail`
 * (a {@link ControllerStateInvalidReason} or a
 * {@link ReleasePreparationFailureReason} respectively) — see
 * {@link RecoveryDiagnostics}, which encodes exactly which fields each
 * problem code may carry.
 */
export const RECOVERY_PROBLEM_CODES = [
  'UPDATE_STATE_ABSENT',
  'UPDATE_STATE_INVALID',
  'UPDATE_STORAGE_UNAVAILABLE',
  'ACTIVE_RELEASE_UNAVAILABLE',
] as const;
/** One of {@link RECOVERY_PROBLEM_CODES}. */
export type RecoveryProblemCode = (typeof RECOVERY_PROBLEM_CODES)[number];

/** Field shape shared by every {@link RecoveryDiagnostics} variant. */
const zodRecoveryDiagnosticsBaseShape = {
  /** This worker's managed channel. */
  channel: zodManagedChannel,
  /** This channel's persisted-state IndexedDB database name. */
  controllerDatabaseName: z.string(),
  /** ISO timestamp this diagnostic snapshot was built. */
  timestamp: z.iso.datetime(),
};

const zodSelectedReleaseNumber = z.number().check(z.refine(isPositiveSafeInteger));

/**
 * The complete, safe diagnostic model the recovery page may render or copy —
 * a closed discriminated union keyed by `problemCode`, so an invalid
 * code/detail combination (e.g. a raw string `problemDetail` on
 * `UPDATE_STATE_ABSENT`, or an un-allowlisted `errorName`) is rejected by
 * TypeScript at every call site, not merely by convention. Every field here
 * is on the architecture's allowlist; nothing else (raw persisted state, raw
 * exceptions, cache keys, local paths, tokens, or user content) may ever
 * reach this shape. Runtime-validated by {@link zodRecoveryDiagnostics} at
 * the single point every diagnostic model is constructed
 * ({@link buildRecoveryDiagnostics}), the boundary where an allowlisted-but-
 * untyped raw value (a storage error name, a preparation failure reason)
 * first crosses into this safe shape.
 */
export const zodRecoveryDiagnostics = z.discriminatedUnion('problemCode', [
  z.strictObject({
    problemCode: z.literal('UPDATE_STATE_ABSENT'),
    ...zodRecoveryDiagnosticsBaseShape,
  }),
  z.strictObject({
    problemCode: z.literal('UPDATE_STATE_INVALID'),
    /** The stable reason the persisted controller-state record is invalid. */
    problemDetail: z.enum(CONTROLLER_STATE_INVALID_REASONS),
    ...zodRecoveryDiagnosticsBaseShape,
  }),
  z.strictObject({
    problemCode: z.literal('UPDATE_STORAGE_UNAVAILABLE'),
    /** An allowlisted browser storage error name, when one is available. */
    errorName: z.optional(z.enum(ALLOWLISTED_STORAGE_ERROR_NAMES)),
    ...zodRecoveryDiagnosticsBaseShape,
  }),
  z.strictObject({
    problemCode: z.literal('ACTIVE_RELEASE_UNAVAILABLE'),
    /** The stable reason exact-release restoration could not make the selected release servable. */
    problemDetail: z.enum(RELEASE_PREPARATION_FAILURE_REASONS),
    /** The known active release number this failure was classified against. */
    selectedReleaseNumber: zodSelectedReleaseNumber,
    ...zodRecoveryDiagnosticsBaseShape,
  }),
]);
/** A {@link zodRecoveryDiagnostics}-validated safe diagnostic model. */
export type RecoveryDiagnostics = z.infer<typeof zodRecoveryDiagnostics>;

/** Inputs to {@link buildRecoveryDiagnostics}: one variant per {@link RecoveryProblemCode}, mirroring {@link RecoveryDiagnostics}'s own closed shape. */
export type BuildRecoveryDiagnosticsInput = {
  /** Injectable clock, for deterministic tests. Defaults to the current time. */
  now?: () => string;
} & (
  | { channel: ManagedChannel; problemCode: 'UPDATE_STATE_ABSENT' }
  | {
      channel: ManagedChannel;
      problemCode: 'UPDATE_STATE_INVALID';
      problemDetail: ControllerStateInvalidReason;
    }
  | {
      channel: ManagedChannel;
      problemCode: 'UPDATE_STORAGE_UNAVAILABLE';
      errorName?: StorageErrorName;
    }
  | {
      channel: ManagedChannel;
      problemCode: 'ACTIVE_RELEASE_UNAVAILABLE';
      problemDetail: ReleasePreparationFailureReason;
      selectedReleaseNumber: number;
    }
);

/**
 * Builds the complete safe {@link RecoveryDiagnostics} model for one recovery
 * page render. The single point that derives `controllerDatabaseName` and
 * `timestamp`, so every recovery page render and every recovery response
 * shares the exact same allowlisted-field construction. Validates the built
 * model against {@link zodRecoveryDiagnostics} before returning it: `input`'s
 * type already rejects an invalid code/detail combination at compile time,
 * but this is the runtime boundary check for the one place an allowlisted
 * raw value (a storage error name, a preparation failure reason) is trusted
 * without having itself been zod-validated at its own origin.
 * @param input - The classified problem and known safe context.
 * @returns The complete diagnostic model.
 * @throws When the constructed model does not satisfy {@link zodRecoveryDiagnostics}.
 */
export function buildRecoveryDiagnostics(
  input: BuildRecoveryDiagnosticsInput,
): RecoveryDiagnostics {
  const timestamp = (input.now ?? (() => new Date().toISOString()))();
  const base = {
    channel: input.channel,
    controllerDatabaseName: buildControllerStateDbName(input.channel),
    timestamp,
  };

  let diagnostics: RecoveryDiagnostics;
  switch (input.problemCode) {
    case 'UPDATE_STATE_ABSENT':
      diagnostics = { ...base, problemCode: input.problemCode };
      break;
    case 'UPDATE_STATE_INVALID':
      diagnostics = { ...base, problemCode: input.problemCode, problemDetail: input.problemDetail };
      break;
    case 'UPDATE_STORAGE_UNAVAILABLE':
      diagnostics = {
        ...base,
        problemCode: input.problemCode,
        ...(input.errorName !== undefined ? { errorName: input.errorName } : {}),
      };
      break;
    case 'ACTIVE_RELEASE_UNAVAILABLE':
      diagnostics = {
        ...base,
        problemCode: input.problemCode,
        problemDetail: input.problemDetail,
        selectedReleaseNumber: input.selectedReleaseNumber,
      };
      break;
  }

  return zodRecoveryDiagnostics.parse(diagnostics);
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
