import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import {
  decodeV3CandidateFileName,
  encodePreferredV3FileName,
  encodeV3FileNameWithParts,
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

  it('supports extended prefixes before numeric suffix fallback', () => {
    const key = getKey();

    expect(encodeV3FileNameWithParts(key, { docPrefixLength: 7, hashPrefixLength: 10 })).toBe(
      `${key[0].slice(0, 7)}.s.${HASH_A.slice(0, 10)}.mf`,
    );
  });
});
