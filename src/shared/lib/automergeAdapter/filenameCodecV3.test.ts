import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import {
  decodeV3CandidateFileName,
  encodePreferredV3FileName,
  encodeV3FileNameWithSuffix,
  V3_MAX_FILE_NAME_LENGTH,
} from './filenameCodecV3';
import type { ChunkStorageKey } from './types';

const HASH_A = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';

const getKey = (): ChunkStorageKey => [new Repo().create({}).documentId, 'snapshot', HASH_A];

describe('filenameCodecV3', () => {
  it('encodes the preferred 6+8 .mf filename', () => {
    const key = getKey();

    expect(encodePreferredV3FileName(key)).toBe(`${key[0].slice(0, 6)}.s.${HASH_A.slice(0, 8)}.mf`);
  });

  it('parses suffixed copied candidates as non-semantic variants', () => {
    const key = getKey();
    const suffixed = `${key[0].slice(0, 6)}.s.${HASH_A.slice(0, 8)} - copy.mf`;

    expect(decodeV3CandidateFileName(suffixed)).toEqual({
      docPrefix: key[0].slice(0, 6),
      kind: 'snapshot',
      hashPrefix: HASH_A.slice(0, 8),
      suffix: ' - copy',
    });
  });

  it('uses controlled numeric suffixes without expanding prefixes', () => {
    const key = getKey();

    expect(encodeV3FileNameWithSuffix(key, 2)).toBe(
      `${key[0].slice(0, 6)}.s.${HASH_A.slice(0, 8)}.2.mf`,
    );
  });

  it('keeps generated v3 filenames under the hard cap', () => {
    const key = getKey();
    const preferred = encodePreferredV3FileName(key);
    const suffixed = encodeV3FileNameWithSuffix(key, 1234567890);

    expect(preferred).toBeDefined();
    expect(preferred?.length).toBeLessThanOrEqual(V3_MAX_FILE_NAME_LENGTH);
    expect(suffixed).toBeDefined();
    expect(suffixed?.length).toBeLessThanOrEqual(V3_MAX_FILE_NAME_LENGTH);
  });

  it('rejects suffixes that would exceed the hard cap', () => {
    const key = getKey();

    expect(encodeV3FileNameWithSuffix(key, 123456789012)).toBeUndefined();
  });
});
