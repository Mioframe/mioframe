import type { Breadcrumb } from '@sentry/vue';
import type { SentryReportingState } from './sentryRuntimeState';
import {
  isSensitiveKey,
  isSensitiveValue,
  DEFAULT_MAX_STRING,
  VERBOSE_MAX_STRING,
} from './privacySanitizer';

/** Narrow project-owned breadcrumb level contract. */
export type TechnicalBreadcrumbLevel = 'debug' | 'info' | 'warning' | 'error';

/**
 * Safe primitive record for technical breadcrumb data. Any string key is allowed at the type
 * level; the sanitizer enforces safety at runtime using the shared denylist.
 */
export type TechnicalBreadcrumbData = Record<string, string | number | boolean | undefined>;

/** Shared project input shape for technical breadcrumbs. */
export type TechnicalBreadcrumbInput = {
  /**
   * Project technical breadcrumb category — any dot-separated string. The sanitizer rejects
   * categories that are empty, too long, or contain sensitive key patterns.
   */
  category: string;
  /** Optional technical metadata. Each key-value pair is sanitized before reaching Sentry. */
  data?: TechnicalBreadcrumbData | undefined;
  /** Optional breadcrumb severity. */
  level?: TechnicalBreadcrumbLevel | undefined;
  /** Optional short technical message. */
  message?: string | undefined;
};

/**
 * Pattern for project-style categories: camelCase segments separated by dots (at least one dot
 * required to distinguish project breadcrumbs from Sentry auto-generated flat categories).
 */
const CATEGORY_RE = /^[a-z][a-zA-Z0-9]*(?:\.[a-zA-Z][a-zA-Z0-9]*)+$/;
const CATEGORY_MAX_LENGTH = 60;

const isSafeCategory = (category: unknown): category is string => {
  if (typeof category !== 'string') return false;
  if (category.length === 0 || category.length > CATEGORY_MAX_LENGTH) return false;
  if (!CATEGORY_RE.test(category)) return false;
  return true;
};

const getMaxStringLength = (isVerbose: boolean): number =>
  isVerbose ? VERBOSE_MAX_STRING : DEFAULT_MAX_STRING;

const sanitizeString = (
  value: unknown,
  isVerbose: boolean,
  maxLength?: number,
): string | undefined => {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  const limit = maxLength ?? getMaxStringLength(isVerbose);
  if (trimmed.length === 0 || trimmed.length > limit) return undefined;
  return trimmed;
};

const sanitizeData = (
  data: Breadcrumb['data'],
  isVerbose: boolean,
): TechnicalBreadcrumbData | undefined => {
  if (!data) return undefined;

  const sanitized: TechnicalBreadcrumbData = {};

  for (const key of Object.keys(data)) {
    if (isSensitiveKey(key)) continue;

    const value: unknown = data[key];
    if (value === undefined) continue;

    if (typeof value === 'boolean') {
      sanitized[key] = value;
      continue;
    }

    if (typeof value === 'number') {
      if (Number.isFinite(value)) sanitized[key] = value;
      continue;
    }

    if (typeof value === 'string') {
      const safeValue = sanitizeString(value, isVerbose);
      if (safeValue !== undefined && !isSensitiveValue(safeValue)) {
        sanitized[key] = safeValue;
      }
      continue;
    }
    // Reject objects, arrays, Error, DOMException, File, Blob, FileSystemHandle, functions, etc.
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
};

const sanitizeLevel = (
  level: Breadcrumb['level'],
  isVerbose: boolean,
): TechnicalBreadcrumbLevel | undefined => {
  if (!level) return 'info';
  if (level === 'fatal' || level === 'log') return undefined;
  if (level === 'debug' && !isVerbose) return undefined;

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
 * Unknown or sensitive categories, sensitive data keys, unsafe value types, overlong strings,
 * and non-technical levels are removed.
 * @param breadcrumb - Raw Sentry breadcrumb.
 * @param isVerbose - When `true`, allows debug-level breadcrumbs and longer strings.
 * @returns Sanitized technical breadcrumb, or `null` when it must be dropped.
 */
export const sanitizeTechnicalBreadcrumb = (
  breadcrumb: Breadcrumb,
  isVerbose: boolean,
): Breadcrumb | null => {
  if (!isSafeCategory(breadcrumb.category)) {
    return null;
  }

  const level = sanitizeLevel(breadcrumb.level, isVerbose);
  if (level === undefined) {
    return null;
  }

  const message = sanitizeString(breadcrumb.message, isVerbose);
  const data = sanitizeData(breadcrumb.data, isVerbose);

  if (message === undefined && data === undefined) {
    return null;
  }

  return {
    category: breadcrumb.category,
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
 * @param isVerbose - Enables debug-level breadcrumbs and longer strings (preview builds).
 * @param getReportingState - Current diagnostics reporting state getter.
 * @returns Hook that keeps only sanitized project technical breadcrumbs.
 */
export const createBeforeBreadcrumb =
  (isVerbose: boolean, getReportingState: () => SentryReportingState = () => 'enabled') =>
  (breadcrumb: Breadcrumb): Breadcrumb | null => {
    if (getReportingState() !== 'enabled') {
      return null;
    }

    return sanitizeTechnicalBreadcrumb(breadcrumb, isVerbose);
  };

/**
 * Sanitizes the breadcrumb array attached to a Sentry event.
 * @param breadcrumbs - Raw event breadcrumbs.
 * @param isVerbose - Enables debug-level breadcrumbs and longer strings (preview builds).
 * @returns Sanitized breadcrumbs, or `undefined` when none remain.
 */
export const sanitizeTechnicalBreadcrumbs = (
  breadcrumbs: Breadcrumb[] | undefined,
  isVerbose: boolean,
): Breadcrumb[] | undefined => {
  if (!breadcrumbs) return undefined;

  const sanitized = breadcrumbs.flatMap((breadcrumb) => {
    const safeBreadcrumb = sanitizeTechnicalBreadcrumb(breadcrumb, isVerbose);
    return safeBreadcrumb ? [safeBreadcrumb] : [];
  });

  return sanitized.length > 0 ? sanitized : undefined;
};

/**
 * Sanitizes breadcrumb data at the public wrapper boundary using non-verbose settings.
 * Removes sensitive keys and unsafe values so callers never accidentally forward private data.
 * The `beforeBreadcrumb` hook provides a second pass as a defense-in-depth safeguard.
 * @param data - Raw breadcrumb data from the public wrapper caller.
 * @returns Sanitized data, or `undefined` when no safe fields remain.
 */
export const sanitizePublicBreadcrumbData = (
  data: TechnicalBreadcrumbData | undefined,
): TechnicalBreadcrumbData | undefined => sanitizeData(data, false);
