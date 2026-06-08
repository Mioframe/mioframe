import type { Breadcrumb } from '@sentry/vue';
import type { DiagnosticsMode } from '@shared/config';
import type { SentryReportingState } from './sentryRuntimeState';

export const TECHNICAL_BREADCRUMB_CATEGORIES = [
  'repository.storage',
  'webFileSystem.write',
  'writeAccessRecovery',
  'worker.runtime',
  'sentry.runtime',
  'webFileSystem.permission',
] as const;

/** Project-controlled breadcrumb categories allowed through the shared Sentry runtime. */
export type TechnicalBreadcrumbCategory = (typeof TECHNICAL_BREADCRUMB_CATEGORIES)[number];
/** Narrow project-owned breadcrumb level contract. */
export type TechnicalBreadcrumbLevel = 'debug' | 'info' | 'warning' | 'error';

/** Safe primitive record for technical breadcrumb data. Any string key is allowed at the type level; the sanitizer enforces safety at runtime. */
export type TechnicalBreadcrumbData = Record<string, string | number | boolean | undefined>;

/** Shared project input shape for technical breadcrumbs. */
export type TechnicalBreadcrumbInput = {
  /** Project technical breadcrumb category. */
  category: TechnicalBreadcrumbCategory;
  /** Optional technical metadata. Each key-value pair is sanitized before reaching Sentry. */
  data?: TechnicalBreadcrumbData | undefined;
  /** Optional breadcrumb severity. */
  level?: TechnicalBreadcrumbLevel | undefined;
  /** Optional short technical message. */
  message?: string | undefined;
};

const CATEGORY_SET = new Set<string>(TECHNICAL_BREADCRUMB_CATEGORIES);
const PRODUCTION_MAX_STRING_LENGTH = 80;
const PREVIEW_MAX_STRING_LENGTH = 120;

/**
 * Lowercase denylist of key-name substrings that are unsafe for Sentry even when their value is
 * a primitive. Prevents leaking paths, identifiers, credentials, or user-controlled content.
 * Applied as a substring check so `storageKey`, `fileHandle`, `documentTitle`, etc. are caught.
 */
const SENSITIVE_KEY_PARTS = [
  'path',
  'file',
  'filename',
  'name',
  'document',
  'doc',
  'storagekey',
  'key',
  'url',
  'uri',
  'href',
  'email',
  'user',
  'username',
  'account',
  'token',
  'secret',
  'credential',
  'cookie',
  'content',
  'body',
  'bytes',
  'handle',
  'message',
  'cause',
  'stack',
];

const isSensitiveKey = (key: string): boolean => {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PARTS.some((part) => lower.includes(part));
};

// Patterns that indicate a value contains private data even on an allowed key.
const PATH_LIKE_RE = /(?:^|[\s"'`(])(?:\/[^/\s]{1,260}){2,}|^[a-zA-Z]:\\|^\.{1,2}[/\\]/;
const URL_LIKE_RE = /^[a-z][a-z0-9+\-.]{1,20}:\/\//i;
const EMAIL_LIKE_RE = /[^@\s]{1,64}@[^@\s]{1,255}\.[a-z]{2,}/i;
// Storage-key-like: 20+ alphanumeric chars followed by _ or ~ separator (legacy and v2 automerge formats).
const STORAGE_KEY_LIKE_RE = /^[A-Za-z0-9]{20,}[_~][A-Za-z0-9_~.-]{1,}/;

const isSensitiveValue = (value: string): boolean => {
  if (PATH_LIKE_RE.test(value)) return true;
  if (URL_LIKE_RE.test(value)) return true;
  if (EMAIL_LIKE_RE.test(value)) return true;
  if (STORAGE_KEY_LIKE_RE.test(value)) return true;
  return false;
};

const getMaxStringLength = (diagnosticsMode: DiagnosticsMode): number =>
  diagnosticsMode === 'preview' ? PREVIEW_MAX_STRING_LENGTH : PRODUCTION_MAX_STRING_LENGTH;

const sanitizeString = (
  value: unknown,
  diagnosticsMode: DiagnosticsMode,
  maxLength?: number,
): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  const limit = maxLength ?? getMaxStringLength(diagnosticsMode);
  if (trimmed.length === 0 || trimmed.length > limit) {
    return undefined;
  }

  return trimmed;
};

const sanitizeData = (
  data: Breadcrumb['data'],
  diagnosticsMode: DiagnosticsMode,
): TechnicalBreadcrumbData | undefined => {
  if (!data) {
    return undefined;
  }

  const sanitized: TechnicalBreadcrumbData = {};

  for (const key of Object.keys(data)) {
    if (isSensitiveKey(key)) {
      continue;
    }

    const value: unknown = data[key];

    if (value === undefined) {
      continue;
    }

    if (typeof value === 'boolean') {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === 'number') {
      if (Number.isFinite(value)) {
        sanitized[key] = value;
      }
      continue;
    }

    if (typeof value === 'string') {
      const safeValue = sanitizeString(value, diagnosticsMode);
      if (safeValue !== undefined && !isSensitiveValue(safeValue)) {
        sanitized[key] = safeValue;
      }
      continue;
    }

    // Reject objects, arrays, Error, DOMException, File, Blob, FileSystemHandle, functions, symbols, and bigint.
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

const sanitizeLevel = (
  level: Breadcrumb['level'],
  diagnosticsMode: DiagnosticsMode,
): TechnicalBreadcrumbLevel | undefined => {
  if (!level) {
    return 'info';
  }

  if (level === 'fatal' || level === 'log') {
    return undefined;
  }

  if (level === 'debug' && diagnosticsMode !== 'preview') {
    return undefined;
  }

  switch (level) {
    case 'debug':
    case 'info':
    case 'warning':
    case 'error':
      return level;
    default:
      return undefined;
  }
};

/**
 * Sanitizes a Sentry breadcrumb down to the project's technical breadcrumb contract.
 * Unknown categories, sensitive data keys, unsafe value types, overlong strings, and non-technical
 * levels are removed. Safe primitive fields pass automatically without per-key registration.
 * @param breadcrumb - Raw Sentry breadcrumb.
 * @param diagnosticsMode - Shared diagnostics detail mode.
 * @returns Sanitized technical breadcrumb, or `null` when it must be dropped.
 */
export const sanitizeTechnicalBreadcrumb = (
  breadcrumb: Breadcrumb,
  diagnosticsMode: DiagnosticsMode,
): Breadcrumb | null => {
  const category = breadcrumb.category;
  if (typeof category !== 'string' || !CATEGORY_SET.has(category)) {
    return null;
  }

  const level = sanitizeLevel(breadcrumb.level, diagnosticsMode);
  if (level === undefined) {
    return null;
  }

  const message = sanitizeString(breadcrumb.message, diagnosticsMode);
  const data = sanitizeData(breadcrumb.data, diagnosticsMode);

  if (message === undefined && data === undefined) {
    return null;
  }

  return {
    category,
    ...(data !== undefined ? { data } : {}),
    level,
    ...(message !== undefined ? { message } : {}),
    ...(typeof breadcrumb.timestamp === 'number' && Number.isFinite(breadcrumb.timestamp)
      ? { timestamp: breadcrumb.timestamp }
      : {}),
  };
};

/**
 * Builds the Sentry `beforeBreadcrumb` hook for shared technical breadcrumb filtering.
 * @param diagnosticsMode - Shared diagnostics detail mode.
 * @param getReportingState - Current diagnostics reporting state getter.
 * @returns Hook that keeps only sanitized project technical breadcrumbs.
 */
export const createBeforeBreadcrumb =
  (
    diagnosticsMode: DiagnosticsMode,
    getReportingState: () => SentryReportingState = () => 'enabled',
  ) =>
  (breadcrumb: Breadcrumb): Breadcrumb | null => {
    if (getReportingState() !== 'enabled') {
      return null;
    }

    return sanitizeTechnicalBreadcrumb(breadcrumb, diagnosticsMode);
  };

/**
 * Sanitizes the breadcrumb array attached to a Sentry event.
 * @param breadcrumbs - Raw event breadcrumbs.
 * @param diagnosticsMode - Shared diagnostics detail mode.
 * @returns Sanitized breadcrumbs, or `undefined` when none remain.
 */
export const sanitizeTechnicalBreadcrumbs = (
  breadcrumbs: Breadcrumb[] | undefined,
  diagnosticsMode: DiagnosticsMode,
): Breadcrumb[] | undefined => {
  if (!breadcrumbs) {
    return undefined;
  }

  const sanitized = breadcrumbs.flatMap((breadcrumb) => {
    const safeBreadcrumb = sanitizeTechnicalBreadcrumb(breadcrumb, diagnosticsMode);
    return safeBreadcrumb ? [safeBreadcrumb] : [];
  });

  return sanitized.length > 0 ? sanitized : undefined;
};
