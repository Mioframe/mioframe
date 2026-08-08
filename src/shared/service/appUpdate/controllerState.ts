import { createStore, get, set } from 'idb-keyval';
import { captureDiagnosticException } from '@shared/lib/diagnostics';
import {
  CONTROLLER_STATE_SCHEMA_VERSION,
  zodUpdateControllerState,
  zodUpdateControllerStateShape,
  type ManagedChannel,
  type UpdateControllerState,
} from './contracts';

const CONTROLLER_STATE_KEY = 'controllerState';

/**
 * Builds this channel's persisted-state IndexedDB database name.
 *
 * Intentionally a small, fixed two-channel mapping rather than an import of
 * `config/plugins/pwa.ts`'s general `{ channel, channelId }` build-time cache
 * namespacing: this runs inside the browser worker bundle, which cannot
 * depend on Node-only Vite config. Keep the produced names aligned with
 * `buildChannelCacheNamespace('stable')` / `buildChannelCacheNamespace('branch', 'develop')`.
 * @param channel - Managed channel.
 * @returns The channel's IndexedDB database name.
 */
export const buildControllerStateDbName = (channel: ManagedChannel): string =>
  channel === 'stable'
    ? 'mioframe-update-controller-stable'
    : 'mioframe-update-controller-branch-develop';

/**
 * Creates this channel's `idb-keyval` custom store for the persisted
 * controller-state record.
 * @param channel - Managed channel.
 * @returns An `idb-keyval` store scoped to this channel.
 */
export const createControllerStateStore = (channel: ManagedChannel) =>
  createStore(buildControllerStateDbName(channel), 'controllerState');

/**
 * Stable reasons a persisted controller-state record is classified invalid,
 * in the exact precedence two-phase validation applies them:
 *
 * 1. `UNSUPPORTED_SCHEMA_VERSION`: the record's own `schemaVersion` field is a
 *    number but does not equal {@link CONTROLLER_STATE_SCHEMA_VERSION} — takes
 *    precedence over every other defect the record might also have;
 * 2. `MALFORMED_RECORD`: the record is missing, incorrectly typed,
 *    structurally invalid, or carries an unknown strict field;
 * 3. `INVARIANT_VIOLATION`: the record is structurally a valid v1 record but
 *    violates a cross-field invariant (e.g. `candidate` not strictly newer
 *    than `activeRelease`).
 */
export const CONTROLLER_STATE_INVALID_REASONS = [
  'UNSUPPORTED_SCHEMA_VERSION',
  'MALFORMED_RECORD',
  'INVARIANT_VIOLATION',
] as const;
/** One of {@link CONTROLLER_STATE_INVALID_REASONS}. */
export type ControllerStateInvalidReason = (typeof CONTROLLER_STATE_INVALID_REASONS)[number];

/**
 * Browser storage error names safe to surface in worker-generated recovery
 * diagnostics. Never the raw exception message — only this fixed allowlist of
 * stable `DOMException`/`Error` `name` values, so a storage failure can be
 * shown without risking any implementation-specific or user-controlled text.
 * Exported so `recoveryDiagnostics.ts` can type and validate against the
 * exact same allowlist rather than duplicating it.
 */
export const ALLOWLISTED_STORAGE_ERROR_NAMES = [
  'AbortError',
  'ConstraintError',
  'InvalidStateError',
  'NotFoundError',
  'QuotaExceededError',
  'SecurityError',
  'UnknownError',
  'VersionError',
] as const;
/** One of {@link ALLOWLISTED_STORAGE_ERROR_NAMES}. */
export type StorageErrorName = (typeof ALLOWLISTED_STORAGE_ERROR_NAMES)[number];

const ALLOWLISTED_STORAGE_ERROR_NAME_SET: ReadonlySet<string> = new Set(
  ALLOWLISTED_STORAGE_ERROR_NAMES,
);

/**
 * Type predicate for {@link ALLOWLISTED_STORAGE_ERROR_NAMES} membership, so
 * callers can narrow a raw `string` to {@link StorageErrorName} without a
 * type assertion.
 * @param name - Candidate error name.
 * @returns Whether `name` is on the allowlist.
 */
function isAllowlistedStorageErrorName(name: string): name is StorageErrorName {
  return ALLOWLISTED_STORAGE_ERROR_NAME_SET.has(name);
}

/**
 * Extracts a safe, allowlisted error `name` from a thrown storage failure, or
 * `undefined` when `error` is not an `Error`-like value with a name on the
 * allowlist. The single point every raw storage exception passes through
 * before it can ever reach a recovery diagnostic.
 * @param error - The raw value thrown by a storage operation.
 * @returns The allowlisted error name, or `undefined`.
 */
function extractAllowlistedStorageErrorName(error: unknown): StorageErrorName | undefined {
  if (
    error instanceof Error &&
    typeof error.name === 'string' &&
    isAllowlistedStorageErrorName(error.name)
  ) {
    return error.name;
  }
  return undefined;
}

/** Result of reading the persisted controller state. */
export type ControllerStateReadResult =
  | { status: 'absent' }
  | { status: 'valid'; state: UpdateControllerState }
  | { status: 'invalid'; reason: ControllerStateInvalidReason }
  | { status: 'storage-unavailable'; errorName?: StorageErrorName };

/**
 * Returns `true` when `raw` carries its own numeric `schemaVersion` field
 * that differs from {@link CONTROLLER_STATE_SCHEMA_VERSION} — checked before
 * full structural validation so an unsupported version is never
 * misclassified as a merely malformed record.
 * @param raw - The raw value read from storage.
 * @returns Whether `raw` declares an unsupported numeric schema version.
 */
function hasUnsupportedNumericSchemaVersion(raw: unknown): boolean {
  if (typeof raw !== 'object' || raw === null || !('schemaVersion' in raw)) return false;
  const value = raw.schemaVersion;
  return typeof value === 'number' && value !== CONTROLLER_STATE_SCHEMA_VERSION;
}

/**
 * Classifies why a record that failed full validation is invalid, applying
 * the exact precedence documented on {@link ControllerStateInvalidReason}.
 * @param raw - The raw value read from storage.
 * @returns The classified invalid reason.
 */
function classifyInvalidReason(raw: unknown): ControllerStateInvalidReason {
  if (hasUnsupportedNumericSchemaVersion(raw)) return 'UNSUPPORTED_SCHEMA_VERSION';
  const structural = zodUpdateControllerStateShape.safeParse(raw);
  if (!structural.success) return 'MALFORMED_RECORD';
  return 'INVARIANT_VIOLATION';
}

/**
 * Parses a raw persisted value into a controller-state read result.
 *
 * Fails closed: an unreadable or structurally invalid record never falls
 * back to a default state (unlike `localSettings`'s default-fallback
 * behavior) because a pinned release must never be silently replaced by
 * whatever the network currently serves. Never weakens or normalizes strict
 * persisted validation — {@link classifyInvalidReason} only explains why the
 * exact same canonical schema already rejected `raw`.
 * @param raw - The raw value read from storage.
 * @returns `'absent'` when nothing is persisted yet, `'valid'` with the
 * parsed state, or `'invalid'` with a stable reason when the record cannot be
 * trusted.
 */
export function parseControllerState(raw: unknown): ControllerStateReadResult {
  if (raw === undefined) return { status: 'absent' };
  const result = zodUpdateControllerState.safeParse(raw);
  if (result.success) return { status: 'valid', state: result.data };
  return { status: 'invalid', reason: classifyInvalidReason(raw) };
}

/**
 * Reads and validates this channel's persisted controller state.
 *
 * A thrown storage-layer failure (e.g. IndexedDB unavailable) is distinct
 * from invalid persisted contents: it is classified as
 * `'storage-unavailable'` with only an optional allowlisted error name, never
 * the raw exception, and never reinterpreted as `'absent'` or `'invalid'`.
 * @param channel - Managed channel.
 * @returns The channel's {@link ControllerStateReadResult}.
 */
export async function readControllerState(
  channel: ManagedChannel,
): Promise<ControllerStateReadResult> {
  let raw: unknown;
  try {
    raw = await get(CONTROLLER_STATE_KEY, createControllerStateStore(channel));
  } catch (error) {
    // The raw cause is passed only to the diagnostics boundary (sanitized by
    // the existing Sentry sanitizer before export); every other caller only
    // ever sees the allowlisted `errorName` below.
    captureDiagnosticException(error, {
      operation: 'controllerStateRead',
      failureClassification: 'storageUnavailable',
    });
    const errorName = extractAllowlistedStorageErrorName(error);
    return errorName
      ? { status: 'storage-unavailable', errorName }
      : { status: 'storage-unavailable' };
  }
  return parseControllerState(raw);
}

/**
 * Atomically persists this channel's complete controller state.
 *
 * Validates `state` against the canonical {@link zodUpdateControllerState}
 * schema before writing: a state that violates the persisted-state invariants
 * (e.g. a candidate not strictly newer than `activeRelease`) must never reach
 * durable storage, since only the next read would otherwise catch it —
 * turning a rejected write into a later full outage for this channel. Never
 * silently normalizes or resets `state`; throws instead.
 * @param channel - Managed channel.
 * @param state - The complete state to persist.
 * @throws {Error} When `state` does not satisfy the canonical controller-state schema.
 */
export async function writeControllerState(
  channel: ManagedChannel,
  state: UpdateControllerState,
): Promise<void> {
  const result = zodUpdateControllerState.safeParse(state);
  if (!result.success) {
    // An internal attempt to persist a state that violates the canonical
    // schema is an unexpected consistency/programmer failure, not an
    // ordinary storage condition — always observable, regardless of consent
    // state noise policy for expected outcomes.
    const error = new Error('Refusing to persist an invalid controller state');
    captureDiagnosticException(error, {
      operation: 'controllerStateWrite',
      failureClassification: 'invalidWriteAttempt',
    });
    throw error;
  }
  try {
    await set(CONTROLLER_STATE_KEY, result.data, createControllerStateStore(channel));
  } catch (error) {
    captureDiagnosticException(error, {
      operation: 'controllerStateWrite',
      failureClassification: 'storageUnavailable',
    });
    throw error;
  }
}
