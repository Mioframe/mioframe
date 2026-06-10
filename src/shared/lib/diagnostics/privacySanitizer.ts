/**
 * Shared denylist-based privacy sanitizer for diagnostic data.
 * Used by both `sanitizeSentryEvent.ts` and `technicalBreadcrumbs.ts`.
 *
 * Design rules:
 * - Preserve useful data by default; deny only known sensitive patterns.
 * - Sensitive key detection uses a substring denylist (case-insensitive).
 * - Sensitive value detection uses regex patterns for paths, URLs, emails, and storage keys.
 * - All string values are truncated to a configurable max length.
 * - Non-primitive types (objects, arrays, functions, File, Blob, handles) are dropped unless
 *   the caller explicitly sanitizes them with a nested call.
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
  'target',
] as const;

const PATH_LIKE_RE = /(?:^|[\s"'`(])(?:\/[^/\s]{1,260}){2,}|^[a-zA-Z]:\\|^\.{1,2}[/\\]/;
const URL_LIKE_RE = /^[a-z][a-z0-9+\-.]{1,20}:\/\//i;
const EMAIL_LIKE_RE = /[^@\s]{1,64}@[^@\s]{1,255}\.[a-z]{2,}/i;
const STORAGE_KEY_LIKE_RE = /^[A-Za-z0-9]{20,}[_~][A-Za-z0-9_~.-]{1,}/;

/**
 * Returns `true` when a key name suggests it may contain private data.
 * Applied as a substring check so `storageKey`, `fileHandle`, `documentTitle`, etc. are caught.
 * @param key - Key name to test.
 * @returns `true` when the key matches the sensitive-key denylist.
 */
export const isSensitiveKey = (key: string): boolean => {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PARTS.some((part) => lower.includes(part));
};

/**
 * Returns `true` when a string value looks like a path, URL, email, or storage key.
 * @param value - String value to test.
 * @returns `true` when the value matches a sensitive pattern.
 */
export const isSensitiveValue = (value: string): boolean => {
  if (PATH_LIKE_RE.test(value)) return true;
  if (URL_LIKE_RE.test(value)) return true;
  if (EMAIL_LIKE_RE.test(value)) return true;
  if (STORAGE_KEY_LIKE_RE.test(value)) return true;
  return false;
};

export const DEFAULT_MAX_STRING = 200;
export const VERBOSE_MAX_STRING = 320;

/**
 * Sanitizes a single string value: trims, checks length, rejects sensitive patterns.
 * Returns `undefined` when the value is empty, too long, or matches a sensitive pattern.
 * @param value - String to sanitize.
 * @param maxLength - Maximum allowed length (default `DEFAULT_MAX_STRING`).
 * @returns Sanitized string or `undefined` when unsafe.
 */
export const sanitizePrimitiveString = (
  value: string,
  maxLength: number = DEFAULT_MAX_STRING,
): string | undefined => {
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed.length > maxLength) return undefined;
  if (isSensitiveValue(trimmed)) return undefined;
  return trimmed;
};

/** JSON-safe scalar type accepted by diagnostic sanitizers. */
export type SafePrimitive = string | number | boolean | null | undefined;

/**
 * Returns `true` when `value` is a JSON-safe scalar (no objects, arrays, or functions).
 * @param value - Value to test.
 * @returns `true` when value is a safe primitive.
 */
const isSafePrimitive = (value: unknown): value is SafePrimitive =>
  value === null ||
  value === undefined ||
  typeof value === 'boolean' ||
  typeof value === 'number' ||
  typeof value === 'string';

/**
 * Sanitizes a flat record of diagnostic data.
 * - Drops keys in the sensitive-key denylist.
 * - Drops non-primitive values (objects, arrays, functions, etc.).
 * - Drops non-finite numbers.
 * - Drops strings that are too long or match sensitive value patterns.
 * @param data - Raw key-value record from a diagnostic payload.
 * @param maxStringLength - Maximum allowed string value length.
 * @returns Sanitized record, or `undefined` when no safe fields remain.
 */
export const sanitizeFlatRecord = (
  data: Record<string, unknown>,
  maxStringLength: number = DEFAULT_MAX_STRING,
): Record<string, SafePrimitive> | undefined => {
  const result: Record<string, SafePrimitive> = {};

  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveKey(key)) continue;
    if (!isSafePrimitive(value)) continue;
    if (value === null || value === undefined) continue;
    if (typeof value === 'number' && !Number.isFinite(value)) continue;
    if (typeof value === 'string') {
      const safe = sanitizePrimitiveString(value, maxStringLength);
      if (safe === undefined) continue;
      result[key] = safe;
      continue;
    }
    result[key] = value;
  }

  return Object.keys(result).length > 0 ? result : undefined;
};
