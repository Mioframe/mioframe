import type { ChangedType, ChunkStorageKey } from './types';

export const V3_FILE_EXTENSION = 'mf';
export const V3_DOC_PREFIX_LENGTH = 6;
export const V3_HASH_PREFIX_LENGTH = 8;
export const V3_FINGERPRINT_LENGTH = 8;
export const V3_MAX_FILE_NAME_LENGTH = 31;

const KIND_TO_CODE: Readonly<Record<ChangedType, string>> = {
  snapshot: 's',
  incremental: 'i',
};

const CODE_TO_KIND: Readonly<Record<string, ChangedType>> = {
  s: 'snapshot',
  i: 'incremental',
};

const V3_FILENAME_RE =
  /^(?<docPrefix>[A-Za-z0-9]{6})\.(?<kindCode>[si])\.(?<hashPrefix>[0-9a-f]{8})(?:\.(?<fingerprint>[0-9a-f]{8}))?(?<suffix>.*)\.mf$/;
const V3_SUPPORTED_SUFFIX_RE = /^(|\.\d+| \(\d+\)| - copy(?: \(\d+\))?)$/;

/** 32-bit FNV-1a offset basis. */
const FNV_OFFSET_BASIS = 0x811c9dc5;
/** 32-bit FNV-1a prime multiplier. */
const FNV_PRIME = 0x01000193;

/**
 * Computes a deterministic, non-cryptographic 32-bit FNV-1a hash of a string.
 * Used only to disambiguate generated v3 filenames; never used for security purposes.
 * @param input - Input string to hash.
 * @returns Unsigned 32-bit hash value.
 */
const fnv1a32 = (input: string): number => {
  let hash = FNV_OFFSET_BASIS;

  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME);
  }

  return hash >>> 0;
};

/**
 * Computes a short deterministic fingerprint for the full logical chunk storage key.
 * The fingerprint is stable for the same logical key and lets generated v3 filenames stay
 * distinct even when truncated documentId/hash prefixes collide between different logical keys.
 * @param key - Full logical Automerge chunk key.
 * @returns 8 lowercase hex character fingerprint.
 */
export const computeStorageKeyFingerprint = (key: ChunkStorageKey): string => {
  const [documentId, kind, hash] = key;

  return fnv1a32(`${documentId}\x00${kind}\x00${hash}`)
    .toString(16)
    .padStart(V3_FINGERPRINT_LENGTH, '0');
};

/**
 * Parsed candidate parts for a plausible v3 `.mf` filename.
 */
export interface V3CandidateFileNameParts {
  /** Leading documentId candidate prefix from the physical filename. */
  docPrefix: string;
  /** Logical storage kind recovered from the v3 kind code. */
  kind: ChangedType;
  /** Leading hash candidate prefix from the physical filename. */
  hashPrefix: string;
  /** Full-key fingerprint segment, when present. Absent on pre-fingerprint legacy v3 files. */
  fingerprint: string | undefined;
  /** Non-semantic copied-file suffix preserved only for candidate matching. */
  suffix: string;
}

/**
 * Returns the stable short family prefix shared by every generated v3 filename variant of a key,
 * independent of the fingerprint segment. Used to recognize manual/copy/numeric-suffix v3 files
 * that were created before the fingerprint segment existed.
 * @param key - Full logical Automerge chunk key.
 * @returns `<docPrefix>.<kindCode>.<hashPrefix>` without the fingerprint, suffix, or extension.
 */
export const encodeV3ShortFamilyPrefix = (key: ChunkStorageKey): string | undefined => {
  const [documentId, kind, hash] = key;
  const kindCode = KIND_TO_CODE[kind];

  if (
    !kindCode ||
    documentId.length < V3_DOC_PREFIX_LENGTH ||
    hash.length < V3_HASH_PREFIX_LENGTH
  ) {
    return undefined;
  }

  return `${documentId.slice(0, V3_DOC_PREFIX_LENGTH)}.${kindCode}.${hash.slice(0, V3_HASH_PREFIX_LENGTH)}`;
};

/**
 * Encodes the preferred short `.mf` filename for a full chunk storage key.
 * The filename includes a deterministic fingerprint of the full logical key so that different
 * logical keys do not normally compete for the same generated filename.
 * @param key - Full logical Automerge chunk key.
 * @returns Preferred short physical filename, or undefined when the key is invalid.
 */
export const encodePreferredV3FileName = (key: ChunkStorageKey): string | undefined => {
  const shortPrefix = encodeV3ShortFamilyPrefix(key);

  if (!shortPrefix) {
    return undefined;
  }

  return `${shortPrefix}.${computeStorageKeyFingerprint(key)}.${V3_FILE_EXTENSION}`;
};

/**
 * Encodes a v3 filename with the fixed short prefixes and an optional numeric suffix.
 * @param key - Full logical Automerge chunk key.
 * @param suffixNumber - Optional numeric suffix used for collision handling.
 * @returns Physical filename candidate, or undefined when the candidate would exceed the hard cap.
 */
export const encodeV3FileNameWithSuffix = (
  key: ChunkStorageKey,
  suffixNumber?: number,
): string | undefined => {
  const baseName = encodePreferredV3FileName(key);

  if (!baseName) {
    return undefined;
  }

  if (suffixNumber === undefined) {
    return baseName;
  }

  if (!Number.isSafeInteger(suffixNumber) || suffixNumber <= 0) {
    return undefined;
  }

  const fileName = baseName.replace(
    `.${V3_FILE_EXTENSION}`,
    `.${suffixNumber}.${V3_FILE_EXTENSION}`,
  );

  return fileName.length <= V3_MAX_FILE_NAME_LENGTH ? fileName : undefined;
};

/**
 * Parses a plausible v3 candidate filename, including supported copied-file suffix variants.
 * @param name - Physical filename to inspect.
 * @returns Parsed candidate parts, or undefined when the name is not a plausible v3 file.
 */
export const decodeV3CandidateFileName = (name: string): V3CandidateFileNameParts | undefined => {
  const match = V3_FILENAME_RE.exec(name);

  if (!match?.groups) {
    return undefined;
  }

  const { docPrefix, kindCode, hashPrefix, fingerprint, suffix } = match.groups;
  const kind = CODE_TO_KIND[kindCode ?? ''];

  if (!docPrefix || !kind || !hashPrefix) {
    return undefined;
  }

  if (!V3_SUPPORTED_SUFFIX_RE.test(suffix ?? '')) {
    return undefined;
  }

  return {
    docPrefix,
    kind,
    hashPrefix,
    fingerprint,
    suffix: suffix ?? '',
  };
};
