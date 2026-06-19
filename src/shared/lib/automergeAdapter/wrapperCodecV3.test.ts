import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import type { ChunkStorageKey } from './types';
import { decodeV3StorageWrapper, encodeV3StorageWrapper } from './wrapperCodecV3';

const HASH_A = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';
const DATA_A = new Uint8Array([1, 2, 3]);

const getKey = (): ChunkStorageKey => [new Repo().create({}).documentId, 'snapshot', HASH_A];

describe('wrapperCodecV3', () => {
  it('round-trips the full logical key and raw Automerge bytes', () => {
    const key = getKey();
    const wrapped = encodeV3StorageWrapper(key, DATA_A);

    expect(decodeV3StorageWrapper(wrapped)).toEqual({
      key,
      data: DATA_A,
    });
  });

  it('rejects empty payload wrappers', () => {
    const key = getKey();
    const wrapped = encodeV3StorageWrapper(key, new Uint8Array());

    expect(decodeV3StorageWrapper(wrapped)).toBeUndefined();
  });

  it('returns undefined instead of throwing for truncated wrappers', () => {
    const key = getKey();
    const wrapped = encodeV3StorageWrapper(key, DATA_A);

    for (let length = 0; length < wrapped.length; length += 1) {
      expect(() => decodeV3StorageWrapper(wrapped.subarray(0, length))).not.toThrow();
      expect(decodeV3StorageWrapper(wrapped.subarray(0, length))).toBeUndefined();
    }
  });
});
