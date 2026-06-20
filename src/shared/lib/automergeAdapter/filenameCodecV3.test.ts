import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import {
  computeStorageKeyFingerprint,
  decodeAnyV3CandidateFileName,
  decodePrimaryV3FileName,
  encodePrimaryV3FileName,
  V3_FINGERPRINT_LENGTH,
  V3_MAX_FILE_NAME_LENGTH,
} from './filenameCodecV3';
import type { ChunkStorageKey } from './types';

const HASH_A = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';
const HASH_B = '1af20e59befbb1e02b595c117f9965dfd7751e527856df1dd985d18138c7add3';

const getKey = (): ChunkStorageKey => [new Repo().create({}).documentId, 'snapshot', HASH_A];

describe('filenameCodecV3 primary filename contract', () => {
  it('encodes the primary filename as <docPrefix>.<kindCode>.<fingerprint>.mf', () => {
    const key = getKey();
    const docPrefix = key[0].slice(0, 6);
    const fingerprint = computeStorageKeyFingerprint(key);

    expect(encodePrimaryV3FileName(key)).toBe(`${docPrefix}.s.${fingerprint}.mf`);
  });

  it('never includes a hash prefix in the primary filename', () => {
    const key = getKey();
    const fileName = encodePrimaryV3FileName(key);

    expect(fileName).toBeDefined();
    expect(fileName).not.toContain(HASH_A.slice(0, 8));
  });

  it('produces a fingerprint of exactly 12 lowercase hex characters', () => {
    const fingerprint = computeStorageKeyFingerprint(getKey());

    expect(fingerprint).toHaveLength(V3_FINGERPRINT_LENGTH);
    expect(fingerprint).toMatch(/^[0-9a-f]{12}$/);
  });

  it('keeps the fingerprint stable for the same logical key and distinct for different keys', () => {
    const key = getKey();
    const otherKindKey: ChunkStorageKey = [key[0], 'incremental', key[2]];
    const otherHashKey: ChunkStorageKey = [key[0], key[1], HASH_B];

    expect(computeStorageKeyFingerprint(key)).toBe(computeStorageKeyFingerprint(key));
    expect(computeStorageKeyFingerprint(key)).not.toBe(computeStorageKeyFingerprint(otherKindKey));
    expect(computeStorageKeyFingerprint(key)).not.toBe(computeStorageKeyFingerprint(otherHashKey));
  });

  it('does not let two keys sharing a truncated documentId prefix collide on the primary filename', () => {
    const documentId = getKey()[0];
    const keyA: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const keyB: ChunkStorageKey = [documentId, 'snapshot', HASH_B];

    expect(encodePrimaryV3FileName(keyA)).not.toBe(encodePrimaryV3FileName(keyB));
  });

  it('keeps the primary filename well below the hard cap', () => {
    const fileName = encodePrimaryV3FileName(getKey());

    expect(fileName).toBeDefined();
    expect(fileName?.length).toBeLessThanOrEqual(V3_MAX_FILE_NAME_LENGTH);
    // 6 (docPrefix) + 1 (.) + 1 (kindCode) + 1 (.) + 12 (fingerprint) + 1 (.) + 2 (mf) = 24
    expect(fileName?.length).toBe(24);
  });

  it('parses a generated primary filename back into its parts', () => {
    const key = getKey();
    const fileName = encodePrimaryV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(decodePrimaryV3FileName(fileName)).toEqual({
      docPrefix: key[0].slice(0, 6),
      kind: 'snapshot',
      fingerprint: computeStorageKeyFingerprint(key),
    });
  });

  it('rejects hash-prefix, suffixed, and copied .mf names as primary candidates', () => {
    const key = getKey();
    const docPrefix = key[0].slice(0, 6);
    const hashPrefix = HASH_A.slice(0, 8);

    expect(decodePrimaryV3FileName(`${docPrefix}.s.${hashPrefix}.mf`)).toBeUndefined();
    expect(decodePrimaryV3FileName(`${docPrefix}.s.${hashPrefix}.1.mf`)).toBeUndefined();
    expect(decodePrimaryV3FileName(`${docPrefix}.s.${hashPrefix} - copy.mf`)).toBeUndefined();
  });
});

describe('decodeAnyV3CandidateFileName', () => {
  it('matches only strict primary filenames', () => {
    const key = getKey();
    const primaryName = encodePrimaryV3FileName(key);

    if (!primaryName) {
      throw new Error('Expected v3 filename');
    }

    expect(decodeAnyV3CandidateFileName(primaryName)).toEqual({
      docPrefix: key[0].slice(0, 6),
      kind: 'snapshot',
      fingerprint: computeStorageKeyFingerprint(key),
    });
  });

  it('rejects malformed and unrelated names', () => {
    expect(decodeAnyV3CandidateFileName('not-a-v3-file.mf')).toBeUndefined();
    expect(
      decodeAnyV3CandidateFileName(`${getKey()[0].slice(0, 6)}.s.${HASH_A.slice(0, 8)}.mf`),
    ).toBeUndefined();
    expect(
      decodeAnyV3CandidateFileName(`${getKey()[0].slice(0, 6)}.s.${HASH_A.slice(0, 8)} - copy.mf`),
    ).toBeUndefined();
    expect(decodeAnyV3CandidateFileName('')).toBeUndefined();
  });
});
