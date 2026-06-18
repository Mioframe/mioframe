import type { ChangedType, ChunkStorageKey } from './types';

export const V3_FILE_EXTENSION = 'mf';

const KIND_TO_CODE: Readonly<Record<ChangedType, string>> = {
  snapshot: 's',
  incremental: 'i',
};

const CODE_TO_KIND: Readonly<Record<string, ChangedType>> = {
  s: 'snapshot',
  i: 'incremental',
};

const DOC_PREFIX_LENGTH = 6;
const HASH_PREFIX_LENGTH = 8;
const V3_FILENAME_RE =
  /^(?<docPrefix>[A-Za-z0-9]{6})\.(?<kindCode>[si])\.(?<hashPrefix>[0-9a-f]{8})(?<suffix>.*)\.mf$/;

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
  /** Non-semantic copied-file suffix preserved only for candidate matching. */
  suffix: string;
}

/**
 * Encodes the preferred short `.mf` filename for a full chunk storage key.
 * @param key - Full logical Automerge chunk key.
 * @returns Preferred short physical filename, or undefined when the key is invalid.
 */
export const encodePreferredV3FileName = (key: ChunkStorageKey): string | undefined => {
  const [documentId, kind, hash] = key;
  const kindCode = KIND_TO_CODE[kind];

  if (!kindCode || documentId.length < DOC_PREFIX_LENGTH || hash.length < HASH_PREFIX_LENGTH) {
    return undefined;
  }

  return `${documentId.slice(0, DOC_PREFIX_LENGTH)}.${kindCode}.${hash.slice(0, HASH_PREFIX_LENGTH)}.${V3_FILE_EXTENSION}`;
};

/**
 * Encodes a v3 filename with extended prefixes or a controlled suffix for collision handling.
 * @param key - Full logical Automerge chunk key.
 * @param options - Prefix lengths and optional suffix to encode.
 * @returns Physical filename candidate, or undefined when the requested lengths are invalid.
 */
export const encodeV3FileNameWithParts = (
  key: ChunkStorageKey,
  options: { docPrefixLength: number; hashPrefixLength: number; suffix?: string },
): string | undefined => {
  const [documentId, kind, hash] = key;
  const kindCode = KIND_TO_CODE[kind];
  const { docPrefixLength, hashPrefixLength, suffix = '' } = options;

  if (
    !kindCode ||
    docPrefixLength < DOC_PREFIX_LENGTH ||
    hashPrefixLength < HASH_PREFIX_LENGTH ||
    documentId.length < docPrefixLength ||
    hash.length < hashPrefixLength
  ) {
    return undefined;
  }

  return `${documentId.slice(0, docPrefixLength)}.${kindCode}.${hash.slice(0, hashPrefixLength)}${suffix}.${V3_FILE_EXTENSION}`;
};

/**
 * Parses a plausible v3 candidate filename, including copied-file suffix variants.
 * @param name - Physical filename to inspect.
 * @returns Parsed candidate parts, or undefined when the name is not a plausible v3 file.
 */
export const decodeV3CandidateFileName = (name: string): V3CandidateFileNameParts | undefined => {
  const match = V3_FILENAME_RE.exec(name);

  if (!match?.groups) {
    return undefined;
  }

  const { docPrefix, kindCode, hashPrefix, suffix } = match.groups;
  const kind = CODE_TO_KIND[kindCode ?? ''];

  if (!docPrefix || !kind || !hashPrefix) {
    return undefined;
  }

  return {
    docPrefix,
    kind,
    hashPrefix,
    suffix: suffix ?? '',
  };
};
