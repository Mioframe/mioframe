import type { ChangedType, ChunkStorageKey } from './types';

export const V3_FILE_EXTENSION = 'mf';
export const V3_DOC_PREFIX_LENGTH = 6;
export const V3_FINGERPRINT_LENGTH = 12;
export const V3_MAX_FILE_NAME_LENGTH = 31;

const KIND_TO_CODE: Readonly<Record<ChangedType, string>> = {
  snapshot: 's',
  incremental: 'i',
};

const CODE_TO_KIND: Readonly<Record<string, ChangedType>> = {
  s: 'snapshot',
  i: 'incremental',
};

const PRIMARY_V3_FILENAME_RE =
  /^(?<docPrefix>[A-Za-z0-9]{6})\.(?<kindCode>[si])\.(?<fingerprint>[0-9a-f]{12})\.mf$/;

/** 64-bit FNV-1a offset basis. */
const FNV64_OFFSET_BASIS = 0xcbf29ce484222325n;
/** 64-bit FNV-1a prime multiplier. */
const FNV64_PRIME = 0x100000001b3n;
const FNV64_MASK = 0xffffffffffffffffn;

/**
 * Computes a deterministic, non-cryptographic 64-bit FNV-1a hash of a string.
 * Used only to disambiguate generated v3 filenames; never used for security purposes.
 * @param input - Input string to hash.
 * @returns Unsigned 64-bit hash value.
 */
const fnv1a64 = (input: string): bigint => {
  let hash = FNV64_OFFSET_BASIS;

  for (let i = 0; i < input.length; i++) {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * FNV64_PRIME) & FNV64_MASK;
  }

  return hash;
};

/**
 * Computes a short deterministic fingerprint for the full logical chunk storage key.
 * The fingerprint is stable for the same logical key and lets the primary generated v3 filename
 * stay distinct even when truncated documentId prefixes collide between different logical keys.
 * @param key - Full logical Automerge chunk key.
 * @returns 12 lowercase hex character fingerprint.
 */
export const computeStorageKeyFingerprint = (key: ChunkStorageKey): string => {
  const [documentId, kind, hash] = key;

  return fnv1a64(`${documentId}\x00${kind}\x00${hash}`)
    .toString(16)
    .padStart(16, '0')
    .slice(0, V3_FINGERPRINT_LENGTH);
};

/** Parsed parts of a strict primary v3 `.mf` filename. */
export interface PrimaryV3FileNameParts {
  /** Leading documentId prefix from the physical filename. */
  docPrefix: string;
  /** Logical storage kind recovered from the v3 kind code. */
  kind: ChangedType;
  /** Full-key fingerprint segment. */
  fingerprint: string;
}

/**
 * Encodes the primary deterministic `.mf` filename for a full chunk storage key.
 * The filename participates in routing: `<docPrefix>.<kindCode>.<fingerprint>.mf`, where
 * `fingerprint` is a 12 lowercase hex character hash of the full logical key. It never contains a
 * hash prefix; the full `StorageKey` lives inside the wrapper and confirms the logical key after
 * filename routing.
 * @param key - Full logical Automerge chunk key.
 * @returns Primary physical filename, or undefined when the key is invalid.
 */
export const encodePrimaryV3FileName = (key: ChunkStorageKey): string | undefined => {
  const [documentId, kind] = key;
  const kindCode = KIND_TO_CODE[kind];

  if (!kindCode || documentId.length < V3_DOC_PREFIX_LENGTH) {
    return undefined;
  }

  const docPrefix = documentId.slice(0, V3_DOC_PREFIX_LENGTH);
  const fingerprint = computeStorageKeyFingerprint(key);

  return `${docPrefix}.${kindCode}.${fingerprint}.${V3_FILE_EXTENSION}`;
};

/**
 * Parses a filename as a strict primary v3 candidate. Used by exact load/save/remove and by
 * normal generated v3 writes. Does not accept hash-prefix, copied, suffixed, or extra-segment
 * names.
 * @param name - Physical filename to inspect.
 * @returns Parsed primary candidate parts, or undefined when the name is not a primary v3 file.
 */
export const decodePrimaryV3FileName = (name: string): PrimaryV3FileNameParts | undefined => {
  const match = PRIMARY_V3_FILENAME_RE.exec(name);

  if (!match?.groups) {
    return undefined;
  }

  const { docPrefix, kindCode, fingerprint } = match.groups;
  const kind = CODE_TO_KIND[kindCode ?? ''];

  if (!docPrefix || !kind || !fingerprint) {
    return undefined;
  }

  return { docPrefix, kind, fingerprint };
};

/** Plausible strict primary v3 `.mf` candidate parts. */
export interface AnyV3CandidateParts {
  /** Leading documentId candidate prefix from the physical filename. */
  docPrefix: string;
  /** Logical storage kind recovered from the v3 kind code. */
  kind: ChangedType;
}

/**
 * Parses a filename as a strict primary v3 candidate. Used by range/discovery scans and general
 * repository candidate filtering.
 * @param name - Physical filename to inspect.
 * @returns Parsed candidate parts, or undefined when the name is not a plausible v3 file.
 */
export const decodeAnyV3CandidateFileName = (name: string): AnyV3CandidateParts | undefined =>
  decodePrimaryV3FileName(name);
