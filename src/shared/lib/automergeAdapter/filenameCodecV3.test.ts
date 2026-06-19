import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import {
  computeStorageKeyFingerprint,
  decodeV3CandidateFileName,
  encodePreferredV3FileName,
  encodeV3FileNameWithSuffix,
  encodeV3ShortFamilyPrefix,
  V3_MAX_FILE_NAME_LENGTH,
} from './filenameCodecV3';
import type { ChunkStorageKey } from './types';

const HASH_A = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';
const HASH_B = '1af20e59befbb1e02b595c117f9965dfd7751e527856df1dd985d18138c7add3';

const getKey = (): ChunkStorageKey => [new Repo().create({}).documentId, 'snapshot', HASH_A];

describe('filenameCodecV3', () => {
  it('encodes the preferred filename with the short prefix and a deterministic fingerprint', () => {
    const key = getKey();
    const shortPrefix = encodeV3ShortFamilyPrefix(key);
    const fingerprint = computeStorageKeyFingerprint(key);

    expect(encodePreferredV3FileName(key)).toBe(`${shortPrefix}.${fingerprint}.mf`);
  });

  it('keeps the fingerprint stable for the same logical key and distinct for different keys', () => {
    const key = getKey();
    const otherKindKey: ChunkStorageKey = [key[0], 'incremental', key[2]];
    const otherHashKey: ChunkStorageKey = [key[0], key[1], HASH_B];

    expect(computeStorageKeyFingerprint(key)).toBe(computeStorageKeyFingerprint(key));
    expect(computeStorageKeyFingerprint(key)).not.toBe(computeStorageKeyFingerprint(otherKindKey));
    expect(computeStorageKeyFingerprint(key)).not.toBe(computeStorageKeyFingerprint(otherHashKey));
  });

  it('does not let two keys sharing a truncated doc/hash prefix collide on the preferred filename', () => {
    const documentId = getKey()[0];
    const keyA: ChunkStorageKey = [documentId, 'snapshot', HASH_A];
    const keyB: ChunkStorageKey = [
      documentId,
      'snapshot',
      `${HASH_A.slice(0, 8)}ffffffffffffffffffffffffffffffffffffffffffffffffffffffff`,
    ];

    expect(encodePreferredV3FileName(keyA)).not.toBe(encodePreferredV3FileName(keyB));
  });

  it('parses suffixed copied candidates as non-semantic variants', () => {
    const key = getKey();
    const suffixed = `${key[0].slice(0, 6)}.s.${HASH_A.slice(0, 8)} - copy.mf`;

    expect(decodeV3CandidateFileName(suffixed)).toEqual({
      docPrefix: key[0].slice(0, 6),
      kind: 'snapshot',
      hashPrefix: HASH_A.slice(0, 8),
      fingerprint: undefined,
      suffix: ' - copy',
    });
  });

  it('parses supported numeric and manual suffix candidates without a fingerprint segment', () => {
    const key = getKey();

    expect(decodeV3CandidateFileName(`${key[0].slice(0, 6)}.s.${HASH_A.slice(0, 8)}.2.mf`)).toEqual(
      {
        docPrefix: key[0].slice(0, 6),
        kind: 'snapshot',
        hashPrefix: HASH_A.slice(0, 8),
        fingerprint: undefined,
        suffix: '.2',
      },
    );
    expect(
      decodeV3CandidateFileName(`${key[0].slice(0, 6)}.s.${HASH_A.slice(0, 8)} (1).mf`),
    ).toEqual({
      docPrefix: key[0].slice(0, 6),
      kind: 'snapshot',
      hashPrefix: HASH_A.slice(0, 8),
      fingerprint: undefined,
      suffix: ' (1)',
    });
  });

  it('parses a generated filename with its fingerprint segment', () => {
    const key = getKey();
    const fileName = encodePreferredV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(decodeV3CandidateFileName(fileName)).toEqual({
      docPrefix: key[0].slice(0, 6),
      kind: 'snapshot',
      hashPrefix: HASH_A.slice(0, 8),
      fingerprint: computeStorageKeyFingerprint(key),
      suffix: '',
    });
  });

  it('rejects unrelated same-prefix .mf names', () => {
    const key = getKey();

    expect(
      decodeV3CandidateFileName(`${key[0].slice(0, 6)}.s.${HASH_A.slice(0, 8)}-noise.mf`),
    ).toBeUndefined();
  });

  it('uses controlled numeric suffixes appended after the fingerprint', () => {
    const key = getKey();
    const fingerprint = computeStorageKeyFingerprint(key);

    expect(encodeV3FileNameWithSuffix(key, 2)).toBe(
      `${key[0].slice(0, 6)}.s.${HASH_A.slice(0, 8)}.${fingerprint}.2.mf`,
    );
  });

  it('keeps generated v3 filenames under the hard cap', () => {
    const key = getKey();
    const preferred = encodePreferredV3FileName(key);
    const suffixed = encodeV3FileNameWithSuffix(key, 1);

    expect(preferred).toBeDefined();
    expect(preferred?.length).toBeLessThanOrEqual(V3_MAX_FILE_NAME_LENGTH);
    expect(suffixed).toBeDefined();
    expect(suffixed?.length).toBeLessThanOrEqual(V3_MAX_FILE_NAME_LENGTH);
  });

  it('rejects suffixes that would exceed the hard cap once the fingerprint is included', () => {
    const key = getKey();

    expect(encodeV3FileNameWithSuffix(key, 10)).toBeUndefined();
  });
});
