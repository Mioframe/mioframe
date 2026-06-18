import type { ChangedType, ChunkStorageKey } from './types';

export const V3_FILE_EXTENSION = 'mf';
export const V3_DOC_PREFIX_LENGTH = 6;
export const V3_HASH_PREFIX_LENGTH = 8;
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
  /^(?<docPrefix>[A-Za-z0-9]{6})\.(?<kindCode>[si])\.(?<hashPrefix>[0-9a-f]{8})(?<suffix>.*)\.mf$/;
const V3_SUPPORTED_SUFFIX_RE = /^(|\.\d+| \(\d+\)| - copy(?: \(\d+\))?)$/;

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

  if (
    !kindCode ||
    documentId.length < V3_DOC_PREFIX_LENGTH ||
    hash.length < V3_HASH_PREFIX_LENGTH
  ) {
    return undefined;
  }

  return `${documentId.slice(0, V3_DOC_PREFIX_LENGTH)}.${kindCode}.${hash.slice(0, V3_HASH_PREFIX_LENGTH)}.${V3_FILE_EXTENSION}`;
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

  const { docPrefix, kindCode, hashPrefix, suffix } = match.groups;
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
    suffix: suffix ?? '',
  };
};
