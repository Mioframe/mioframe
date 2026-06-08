import type { Breadcrumb } from '@sentry/vue';
import type { DiagnosticsMode } from '@shared/config';
import type { SentryReportingState } from './sentryRuntimeState';

export const TECHNICAL_BREADCRUMB_CATEGORIES = [
  'repository.storage',
  'webFileSystem.directory',
  'webFileSystem.read',
  'webFileSystem.stat',
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
// Wider limit for basename fields: covers long Automerge filenames used in PR #85 write-failure diagnosis.
const FILENAME_FIELD_MAX_LENGTH = 200;

/**
 * Lowercase denylist of key names that are obviously unsafe for Sentry even when their value is
 * a primitive. Prevents leaking paths, identifiers, credentials, or user-controlled content.
 * Keep this narrow; do not expand it into a per-field allowlist.
 */
const SENSITIVE_KEYS = new Set([
  'path',
  'fullpath',
  'directory',
  'directoryname',
  'rootdirectory',
  'documenttitle',
  'title',
  'content',
  'payload',
  'body',
  'text',
  'handle',
  'filehandle',
  'directoryhandle',
  'storagekey',
  'documentid',
  'userid',
  'accountid',
  'email',
  'username',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'password',
  'rawmessage',
  'errormessage',
  'message',
  'stack',
  'stacktrace',
]);

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

const isFilenameKey = (key: string): boolean => key.endsWith('FileName');

const sanitizeBasename = (value: string): string | undefined => {
  if (value.includes('/') || value.includes('\\') || value.includes('..')) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > FILENAME_FIELD_MAX_LENGTH) {
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
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
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
      const safeValue = isFilenameKey(key)
        ? sanitizeBasename(value)
        : sanitizeString(value, diagnosticsMode);
      if (safeValue !== undefined) {
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
