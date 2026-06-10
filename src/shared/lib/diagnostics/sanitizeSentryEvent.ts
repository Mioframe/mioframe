import type {
  ErrorEvent as SentryErrorEvent,
  Contexts as SentryContexts,
  User as SentryUser,
  Exception as SentryException,
} from '@sentry/vue';
import { isSessionSentryUserId } from './sentrySession';
import type { SentryReportingState } from './sentryRuntimeState';
import { createBeforeBreadcrumb, sanitizeTechnicalBreadcrumbs } from './technicalBreadcrumbs';
import {
  isSensitiveKey,
  isSensitiveValue,
  DEFAULT_MAX_STRING,
  sanitizeFlatRecord,
  sanitizePrimitiveString,
} from './privacySanitizer';

// ---------------------------------------------------------------------------
// Tag filtering — denylist approach
// ---------------------------------------------------------------------------

type SentryTagValue = boolean | number | string | null;

const isSentryTagValue = (value: unknown): value is SentryTagValue =>
  value === null ||
  typeof value === 'boolean' ||
  typeof value === 'number' ||
  typeof value === 'string';

/**
 * Sanitizes Sentry event tags using denylist-based filtering.
 * - Keeps all tags with scalar values.
 * - Drops keys matching the sensitive-key denylist.
 * - Drops string values that match sensitive value patterns.
 * - Truncates long strings.
 * @param source - Raw Sentry event tags.
 * @returns Sanitized tags record.
 */
export const sanitizeEventTags = (
  source: Record<string, unknown> | undefined,
): Record<string, SentryTagValue> => {
  const result: Record<string, SentryTagValue> = {};

  if (!source) return result;

  for (const [key, value] of Object.entries(source)) {
    if (isSensitiveKey(key)) continue;
    if (!isSentryTagValue(value)) continue;
    if (value === null) continue;
    if (
      typeof value === 'string' &&
      (value.length > DEFAULT_MAX_STRING || isSensitiveValue(value))
    ) {
      continue;
    }
    result[key] = value;
  }

  return result;
};

// ---------------------------------------------------------------------------
// Extra filtering — denylist approach
// ---------------------------------------------------------------------------

/**
 * Sanitizes Sentry event extras using denylist-based filtering.
 * Drops sensitive keys, non-primitive types, non-finite numbers, and overlong strings.
 * @param source - Raw Sentry extras.
 * @returns Sanitized extras record.
 */
export const sanitizeEventExtras = (
  source: Record<string, unknown> | undefined,
): Record<string, unknown> => {
  if (!source) return {};
  return sanitizeFlatRecord(source) ?? {};
};

// ---------------------------------------------------------------------------
// Context filtering — denylist approach
// ---------------------------------------------------------------------------

const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Sanitizes Sentry event contexts using denylist-based filtering.
 * - Accepts all context names (no fixed allowlist).
 * - Drops individual context entries when all their fields are filtered out.
 * - Applies the shared denylist to each context field.
 * @param contexts - Sentry event contexts.
 * @returns Sanitized contexts.
 */
export const sanitizeContexts = (contexts: SentryContexts | undefined): SentryContexts => {
  if (!contexts) return {};

  const result: SentryContexts = {};

  for (const [name, ctx] of Object.entries(contexts)) {
    if (!isRecord(ctx)) continue;
    if (isSensitiveKey(name)) continue;
    const sanitized = sanitizeFlatRecord(ctx);
    if (sanitized && Object.keys(sanitized).length > 0) {
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
 * @param user - Sentry user field from the event.
 * @returns Session-scoped user id or `undefined`.
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
// Exception value sanitization — scrubs sensitive messages from exception chain
// ---------------------------------------------------------------------------

const SANITIZED_PLACEHOLDER = '[sanitized]';

/**
 * Sanitizes a single exception entry's `value` (the error message).
 * Replaces values that look like paths, URLs, emails, or storage keys with a placeholder.
 * Keeps short safe strings such as user-facing `DomainError.message`.
 * Preserves all other exception fields (type, stacktrace, mechanism).
 * @param excValue - Sentry exception entry.
 * @returns Exception entry with sanitized `value`.
 */
export const sanitizeExceptionValue = (excValue: SentryException): SentryException => {
  if (excValue.value === undefined) return excValue;
  const safe = sanitizePrimitiveString(excValue.value, DEFAULT_MAX_STRING);
  if (safe === undefined) {
    return { ...excValue, value: SANITIZED_PLACEHOLDER };
  }
  return { ...excValue, value: safe };
};

/**
 * Sanitizes all exception values in the exception chain.
 * Sentry serializes `error.cause` chains as additional linked exception entries.
 * This ensures sensitive messages in nested causes are also scrubbed.
 * @param exception - Sentry event exception container.
 * @returns Exception container with sanitized values, or `undefined` when absent.
 */
export const sanitizeExceptionValues = (
  exception: SentryErrorEvent['exception'],
): SentryErrorEvent['exception'] => {
  if (!exception?.values) return exception;
  return {
    ...exception,
    values: exception.values.map(sanitizeExceptionValue),
  };
};

// ---------------------------------------------------------------------------
// Main sanitizer — used as Sentry beforeSend callback
// ---------------------------------------------------------------------------

type BeforeSendFactory = (params: {
  isVerbose: boolean;
  getState: () => SentryReportingState;
}) => (event: SentryErrorEvent) => SentryErrorEvent | null;

const isUnhandledAccessRequiredEvent = (event: SentryErrorEvent): boolean => {
  if (event.tags?.['eventKind'] === 'handledException') {
    return false;
  }

  return (
    event.exception?.values?.some(
      (value) =>
        value.type === 'WebFileSystemAccessRequiredError' &&
        (value.mechanism?.handled === false || value.mechanism?.type === 'onunhandledrejection'),
    ) ?? false
  );
};

/**
 * Shared `beforeBreadcrumb` callback for both main-thread and worker runtimes.
 * Keeps only sanitized project technical breadcrumbs.
 */
export { createBeforeBreadcrumb };

/**
 * Creates the shared `beforeSend` callback for both main-thread and worker Sentry instances.
 * Acts as the client-side privacy boundary:
 * - Drops events when reporting is not enabled.
 * - Drops unhandled `WebFileSystemAccessRequiredError` events (surfaced separately as recovery UI).
 * - Strips `request` entirely.
 * - Sanitizes exception value messages (the error message in Sentry's exception chain).
 * - Sanitizes breadcrumbs, contexts, user, tags, and extras using denylist-based filtering.
 * - Keeps a session-scoped `user.id`; strips all other user fields.
 * @param root0 - Factory parameters (`isVerbose` and `getState`).
 * @returns `beforeSend` callback for the Sentry client.
 */
export const createBeforeSend: BeforeSendFactory =
  ({ isVerbose, getState }) =>
  (event) => {
    if (getState() !== 'enabled') return null;
    if (isUnhandledAccessRequiredEvent(event)) return null;

    const sanitized: SentryErrorEvent = { ...event };

    delete sanitized.request;

    const safeException = sanitizeExceptionValues(event.exception);
    if (safeException !== undefined) {
      sanitized.exception = safeException;
    }

    const safeBreadcrumbs = sanitizeTechnicalBreadcrumbs(event.breadcrumbs, isVerbose);
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

    const safeExtra = sanitizeEventExtras(event.extra);
    if (Object.keys(safeExtra).length > 0) {
      sanitized.extra = safeExtra;
    } else {
      delete sanitized.extra;
    }

    const safeTags = sanitizeEventTags(event.tags);
    if (Object.keys(safeTags).length > 0) {
      sanitized.tags = safeTags;
    } else {
      delete sanitized.tags;
    }

    return sanitized;
  };
