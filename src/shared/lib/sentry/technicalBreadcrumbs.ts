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

export const TECHNICAL_BREADCRUMB_DATA_KEYS = [
  'operation',
  'result',
  'classification',
  'failureClassification',
  'provider',
  'storageOperation',
  'pendingCount',
  'flushedCount',
  'failedCount',
  'errorClass',
  'domExceptionName',
  'vfsErrorCode',
  'domainErrorCode',
  'errorClassification',
  'step',
  'handleComparisonResult',
  'returnedHandlePermission',
  'returnedHandleProvided',
  'returnedHandleSameEntry',
  'storedHandlePermission',
  'runtime',
] as const;

/** Project-controlled breadcrumb categories allowed through the shared Sentry runtime. */
export type TechnicalBreadcrumbCategory = (typeof TECHNICAL_BREADCRUMB_CATEGORIES)[number];
/** Allowlisted breadcrumb data key. */
export type TechnicalBreadcrumbDataKey = (typeof TECHNICAL_BREADCRUMB_DATA_KEYS)[number];
/** Narrow project-owned breadcrumb level contract. */
export type TechnicalBreadcrumbLevel = 'debug' | 'info' | 'warning' | 'error';

/** Allowlisted project-owned breadcrumb data payload. */
export type TechnicalBreadcrumbData = Partial<
  Record<TechnicalBreadcrumbDataKey, number | string | undefined>
>;

/** Shared project input shape for technical breadcrumbs. */
export type TechnicalBreadcrumbInput = {
  /** Project technical breadcrumb category. */
  category: TechnicalBreadcrumbCategory;
  /** Optional allowlisted technical metadata. */
  data?: TechnicalBreadcrumbData | undefined;
  /** Optional breadcrumb severity. */
  level?: TechnicalBreadcrumbLevel | undefined;
  /** Optional short technical message. */
  message?: string | undefined;
};

const CATEGORY_SET = new Set<string>(TECHNICAL_BREADCRUMB_CATEGORIES);
const PRODUCTION_MAX_STRING_LENGTH = 80;
const PREVIEW_MAX_STRING_LENGTH = 120;

const getMaxStringLength = (diagnosticsMode: DiagnosticsMode): number =>
  diagnosticsMode === 'preview' ? PREVIEW_MAX_STRING_LENGTH : PRODUCTION_MAX_STRING_LENGTH;

const sanitizeString = (value: unknown, diagnosticsMode: DiagnosticsMode): string | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > getMaxStringLength(diagnosticsMode)) {
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

  for (const key of TECHNICAL_BREADCRUMB_DATA_KEYS) {
    const value = data[key];
    if (typeof value === 'number' && Number.isFinite(value)) {
      sanitized[key] = value;
      continue;
    }

    const safeString = sanitizeString(value, diagnosticsMode);
    if (safeString !== undefined) {
      sanitized[key] = safeString;
    }
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
 * Unknown categories, unsafe data keys, overlong strings, and non-technical levels are removed.
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
