import type { ChangedType } from './types';

/**
 * V2 compact Automerge filename format.
 *
 * Separators: `~` (chosen to differ from legacy `_` so both can coexist in one directory).
 * Extension: `.am` (shorter than legacy `.automerge`).
 * Kind codes: `s` = snapshot, `i` = incremental.
 * Hash: 64 hex chars (256-bit SHA) → 32 bytes → 43-char base64url (no padding).
 *
 * Shape: `<documentId>~<kindCode>~<compactHash>.am`
 * Example: `47ySCH1y6Amhs2k5P1eQb2u74MHg~s~DfpDUK_a0N8aSEsAbkhUzshkDUFnRc4MyHTAcCe2nMI.am`
 * Length: 28 + 1 + 1 + 1 + 43 + 3 = 77 chars (vs 112 for legacy).
 */

/** File extension for v2 compact filenames. */
export const V2_FILE_EXTENSION = 'am';

/** Separator used in v2 filenames (distinguishes them from legacy `_` separator). */
export const V2_SEPARATOR = '~';

const KIND_TO_CODE: Readonly<Record<ChangedType, string>> = {
  snapshot: 's',
  incremental: 'i',
};

const CODE_TO_KIND: Readonly<Record<string, ChangedType>> = {
  s: 'snapshot',
  i: 'incremental',
};

/** Regex that validates and captures a v2 filename's components. */
const V2_FILENAME_RE = /^([^~_]+)~([si])~([A-Za-z0-9_-]{43})\.am$/;

/**
 * Converts a 64-character lowercase hex string (32 bytes) to a 43-character base64url string (no padding).
 * @param hex - 64-char lowercase hex string.
 * @returns 43-char base64url string, or undefined when the input is invalid.
 */
export const hexToBase64Url = (hex: string): string | undefined => {
  if (hex.length !== 64 || !/^[0-9a-f]{64}$/.test(hex)) {
    return undefined;
  }

  const bytes = new Uint8Array(32);

  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/**
 * Converts a 43-character base64url string (no padding, 32-byte payload) back to a 64-character lowercase hex string.
 * @param b64u - 43-char base64url string without padding.
 * @returns 64-char lowercase hex string, or undefined when the input is invalid.
 */
export const base64UrlToHex = (b64u: string): string | undefined => {
  if (b64u.length !== 43 || !/^[A-Za-z0-9_-]{43}$/.test(b64u)) {
    return undefined;
  }

  const padded = b64u.replace(/-/g, '+').replace(/_/g, '/') + '=';

  let binary: string;
  try {
    binary = atob(padded);
  } catch {
    return undefined;
  }

  if (binary.length !== 32) {
    return undefined;
  }

  let hex = '';
  for (let i = 0; i < 32; i++) {
    hex += binary.charCodeAt(i).toString(16).padStart(2, '0');
  }

  return hex;
};

/**
 * Encodes a full Automerge storage key `[documentId, kind, hexHash]` as a v2 compact filename.
 * @param documentId - Automerge document ID.
 * @param kind - Storage change kind (`snapshot` or `incremental`).
 * @param hexHash - 64-char lowercase hex hash.
 * @returns V2 compact filename, or undefined when inputs are invalid.
 */
export const encodeStorageKeyToV2FileName = (
  documentId: string,
  kind: ChangedType,
  hexHash: string,
): string | undefined => {
  const kindCode = KIND_TO_CODE[kind];
  const compactHash = hexToBase64Url(hexHash);

  if (!compactHash) {
    return undefined;
  }

  return `${documentId}${V2_SEPARATOR}${kindCode}${V2_SEPARATOR}${compactHash}.${V2_FILE_EXTENSION}`;
};

/**
 * Returns the documentId, kind, and original hex hash extracted from a v2 compact filename.
 * @param name - Filename to parse.
 * @returns Tuple `[documentId, kind, hexHash]`, or undefined when the name is not a v2 filename.
 */
export const decodeV2FileName = (
  name: string,
): readonly [documentId: string, kind: ChangedType, hexHash: string] | undefined => {
  const match = V2_FILENAME_RE.exec(name);

  if (!match) {
    return undefined;
  }

  const [, documentId, kindCode, compactHash] = match;

  const kind = CODE_TO_KIND[kindCode ?? ''];

  if (!kind || !documentId) {
    return undefined;
  }

  const hexHash = base64UrlToHex(compactHash ?? '');

  if (!hexHash) {
    return undefined;
  }

  return [documentId, kind, hexHash] as const;
};

/**
 * Returns whether the given filename matches the v2 compact format.
 * @param name - Filename to test.
 * @returns True when the filename is a valid v2 compact Automerge filename.
 */
export const isV2FileName = (name: string): boolean => V2_FILENAME_RE.test(name);
