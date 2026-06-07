import type {
  ErrorEvent as SentryErrorEvent,
  Contexts as SentryContexts,
  User as SentryUser,
} from '@sentry/vue';
import type { DiagnosticsMode } from '@shared/config';
import { isSessionSentryUserId } from './sentrySession';
import type { SentryReportingState } from './sentryRuntimeState';
import { createBeforeBreadcrumb, sanitizeTechnicalBreadcrumbs } from './technicalBreadcrumbs';

// ---------------------------------------------------------------------------
// Tag filtering
// ---------------------------------------------------------------------------

export const SAFE_EVENT_TAG_KEYS = [
  'handled',
  'feature',
  'action',
  'eventKind',
  'severity',
  'result',
  'classification',
  'provider',
  'operation',
  'failureClassification',
  'returnedHandleProvided',
  'returnedHandleSameEntry',
  'storedHandlePermission',
  'returnedHandlePermission',
  'handleComparisonResult',
] as const;

type SentryTagValue = boolean | number | string | null | undefined;

const isSentryTagValue = (value: unknown): value is SentryTagValue =>
  value === null ||
  value === undefined ||
  typeof value === 'boolean' ||
  typeof value === 'number' ||
  typeof value === 'string';

/**
 * Picks tag keys from a source object that are in the provided allowlist.
 * Non-string-coercible values are excluded.
 * @param source - Raw tag map from a Sentry event.
 * @param keys - Allowlist of safe tag keys.
 * @returns Filtered tag record containing only allowed keys with coercible values.
 */
export const pickEventTags = (
  source: Record<string, unknown> | undefined,
  keys: readonly string[],
): Record<string, SentryTagValue> => {
  const result: Record<string, SentryTagValue> = {};

  if (!source) return result;

  for (const key of keys) {
    const value = source[key];
    if (value !== undefined && isSentryTagValue(value)) {
      result[key] = value;
    }
  }

  return result;
};

// ---------------------------------------------------------------------------
// Extra filtering
// ---------------------------------------------------------------------------

const SAFE_NUMERIC_EXTRA_KEYS = ['pendingCount', 'failedCount', 'flushedCount'] as const;
const SAFE_STRING_EXTRA_KEYS = [
  'userMessage',
  'domainErrorCode',
  'originalThrownType',
  'errorClass',
  'domExceptionName',
  'vfsErrorCode',
  'errorClassification',
  'attemptId',
] as const;
const SAFE_EXTRA_STRING_MAX_LENGTH = 200;

/**
 * Picks safe numeric and string keys from Sentry event extras.
 * Excludes any field not in the project allowlist.
 * @param source - Raw extras map from a Sentry event.
 * @returns Filtered extras record containing only allowlisted numeric and string keys.
 */
export const pickSafeEventExtras = (
  source: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  if (!source) return result;

  for (const key of SAFE_NUMERIC_EXTRA_KEYS) {
    const value = source[key];
    if (typeof value === 'number' && isFinite(value)) {
      result[key] = value;
    }
  }

  for (const key of SAFE_STRING_EXTRA_KEYS) {
    const value = source[key];
    if (typeof value === 'string' && value.length <= SAFE_EXTRA_STRING_MAX_LENGTH) {
      result[key] = value;
    }
  }

  return result;
};

// ---------------------------------------------------------------------------
// Context filtering
// ---------------------------------------------------------------------------

const SAFE_CONTEXT_NAMES = ['diagnostic', 'operation', 'storage'] as const;
type SafeContextName = (typeof SAFE_CONTEXT_NAMES)[number];

const SAFE_CONTEXT_NAMES_SET = new Set<string>(SAFE_CONTEXT_NAMES);

const SAFE_CONTEXT_NUMERIC_KEYS = ['pendingCount', 'flushedCount', 'failedCount'] as const;
const SAFE_CONTEXT_STRING_KEYS = [
  'attemptId',
  'flow',
  'operation',
  'storageOperation',
  'provider',
  'result',
  'classification',
  'failureClassification',
  'errorClass',
  'domExceptionName',
  'vfsErrorCode',
  'domainErrorCode',
  'errorClassification',
  'step',
  'runtime',
] as const;
const SAFE_CONTEXT_STRING_MAX_LENGTH = 200;

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

const sanitizeContextObject = (ctx: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const key of SAFE_CONTEXT_NUMERIC_KEYS) {
    const value = ctx[key];
    if (typeof value === 'number' && isFinite(value)) {
      result[key] = value;
    }
  }

  for (const key of SAFE_CONTEXT_STRING_KEYS) {
    const value = ctx[key];
    if (typeof value === 'string' && value.length <= SAFE_CONTEXT_STRING_MAX_LENGTH) {
      result[key] = value;
    }
  }

  return result;
};

const isSafeContextName = (name: string): name is SafeContextName =>
  SAFE_CONTEXT_NAMES_SET.has(name);

/**
 * Strips unknown context names and unknown fields within allowed contexts.
 * Only `diagnostic`, `operation`, and `storage` context names survive.
 * @param contexts - Raw contexts map from a Sentry event.
 * @returns Sanitized contexts containing only allowed names and safe fields.
 */
export const sanitizeContexts = (contexts: SentryContexts | undefined): SentryContexts => {
  if (!contexts) return {};

  const result: SentryContexts = {};

  for (const [name, ctx] of Object.entries(contexts)) {
    if (!isSafeContextName(name) || !isRecord(ctx)) continue;

    const sanitized = sanitizeContextObject(ctx);
    if (Object.keys(sanitized).length > 0) {
      result[name] = sanitized;
    }
  }

  return result;
};

// ---------------------------------------------------------------------------
// User filtering — keep only session-scoped user.id
// ---------------------------------------------------------------------------

/**
 * Strips all user fields except a valid session-scoped `id`.
 * Non-session user.id values (e.g. emails, stable IDs) are removed entirely.
 * @param user - Raw user object from a Sentry event.
 * @returns Object with only the session-scoped `id`, or `undefined` if no valid session id.
 */
export const sanitizeUser = (user: SentryUser | undefined): { id: string } | undefined => {
  if (!user) return undefined;

  const { id } = user;
  if (isSessionSentryUserId(id)) {
    return { id };
  }

  return undefined;
};

// ---------------------------------------------------------------------------
// Main sanitizer — used as Sentry beforeSend callback
// ---------------------------------------------------------------------------

type BeforeSendFactory = (params: {
  diagnosticsMode: DiagnosticsMode;
  getState: () => SentryReportingState;
}) => (event: SentryErrorEvent) => SentryErrorEvent | null;

/**
 * Shared `beforeBreadcrumb` callback for both main-thread and worker runtimes.
 * Keeps only sanitized project technical breadcrumbs.
 * @param diagnosticsMode - Shared diagnostics detail mode.
 * @returns Hook that keeps only safe project technical breadcrumbs.
 */
export { createBeforeBreadcrumb };

/**
 * Creates the shared `beforeSend` callback for both main-thread and worker Sentry instances.
 * Acts as the client-side privacy boundary:
 * - Drops events when reporting is not enabled.
 * - Strips `request` entirely.
 * - Keeps only sanitized project technical breadcrumbs.
 * - Keeps only whitelisted `contexts` keys (`diagnostic`, `operation`, `storage`) with safe fields.
 * - Keeps only a session-scoped `user.id`; strips all other user fields.
 * - Keeps only whitelisted `tags` keys.
 * - Keeps only whitelisted `extras` keys.
 * @param params - Reporting-state getter plus shared diagnostics mode.
 * @returns The `beforeSend` callback for `Sentry.init`.
 */
export const createBeforeSend: BeforeSendFactory =
  ({ diagnosticsMode, getState }) =>
  (event) => {
    if (getState() !== 'enabled') return null;

    const sanitized: SentryErrorEvent = { ...event };

    delete sanitized.request;

    const safeBreadcrumbs = sanitizeTechnicalBreadcrumbs(event.breadcrumbs, diagnosticsMode);
    if (safeBreadcrumbs !== undefined) {
      sanitized.breadcrumbs = safeBreadcrumbs;
    } else {
      delete sanitized.breadcrumbs;
    }

    const safeContexts = sanitizeContexts(event.contexts);
    if (Object.keys(safeContexts).length > 0) {
      sanitized.contexts = safeContexts;
    } else {
      delete sanitized.contexts;
    }

    const safeUser = sanitizeUser(event.user);
    if (safeUser !== undefined) {
      sanitized.user = safeUser;
    } else {
      delete sanitized.user;
    }

    const safeExtra = pickSafeEventExtras(event.extra);
    if (Object.keys(safeExtra).length > 0) {
      sanitized.extra = safeExtra;
    } else {
      delete sanitized.extra;
    }

    const safeTags = pickEventTags(event.tags, SAFE_EVENT_TAG_KEYS);
    if (Object.keys(safeTags).length > 0) {
      sanitized.tags = safeTags;
    } else {
      delete sanitized.tags;
    }

    return sanitized;
  };
