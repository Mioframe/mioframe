import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import { encodePrimaryV3FileName } from './filenameCodecV3';
import type { ChunkStorageKey } from './types';
import {
  classifyV3ChunkCandidateData,
  isPlausibleV3CandidateForChunkKey,
  isPlausibleV3CandidateForPrefix,
  isPrimaryV3CandidateForKey,
} from './v3StoragePolicy';
import { encodeV3StorageWrapper } from './wrapperCodecV3';

const HASH = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';

const getDocumentId = () => new Repo().create({}).documentId;

describe('isPrimaryV3CandidateForKey', () => {
  it('matches only the exact primary filename for the key', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePrimaryV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPrimaryV3CandidateForKey(fileName, key)).toBe(true);
    expect(isPrimaryV3CandidateForKey(`${fileName}.bak`, key)).toBe(false);
  });

  it('rejects a primary filename generated for a different key', () => {
    const key: ChunkStorageKey = [getDocumentId(), 'snapshot', HASH];
    const otherKey: ChunkStorageKey = [getDocumentId(), 'snapshot', HASH];
    const otherFileName = encodePrimaryV3FileName(otherKey);

    if (!otherFileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPrimaryV3CandidateForKey(otherFileName, key)).toBe(false);
  });
});

describe('isPlausibleV3CandidateForChunkKey', () => {
  it('matches only the strict in-route primary filename for the exact key', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePrimaryV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPlausibleV3CandidateForChunkKey(fileName, key)).toBe(true);
    expect(isPlausibleV3CandidateForChunkKey('dup001.s.abcdef123456.mf', key)).toBe(false);
  });
});

describe('isPlausibleV3CandidateForPrefix', () => {
  it('does not throw and matches every plausible v3 candidate for an empty prefix', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePrimaryV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(() => isPlausibleV3CandidateForPrefix(fileName, [])).not.toThrow();
    expect(isPlausibleV3CandidateForPrefix(fileName, [])).toBe(true);
  });

  it('rejects the marker prefix without decoding v3 candidates', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePrimaryV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPlausibleV3CandidateForPrefix(fileName, ['storage-adapter-id'])).toBe(false);
  });

  it('matches a documentId prefix for the same document', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePrimaryV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPlausibleV3CandidateForPrefix(fileName, [documentId])).toBe(true);
  });

  it('matches a documentId+kind prefix for the same document and kind', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePrimaryV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPlausibleV3CandidateForPrefix(fileName, [documentId, 'snapshot'])).toBe(true);
    expect(isPlausibleV3CandidateForPrefix(fileName, [documentId, 'incremental'])).toBe(false);
  });

  it('matches a full documentId+kind+hash prefix for the same chunk key', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePrimaryV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPlausibleV3CandidateForPrefix(fileName, key)).toBe(true);
  });

  it('rejects an unrelated documentId prefix', () => {
    const documentId = getDocumentId();
    const otherDocumentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePrimaryV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPlausibleV3CandidateForPrefix(fileName, [otherDocumentId])).toBe(false);
  });

  it('rejects compatibility-style and hash-prefix-only .mf names', () => {
    const documentId = getDocumentId();
    const compatibilityName = `${documentId.slice(0, 6)}.s.${HASH.slice(0, 8)} - copy.mf`;
    const hashPrefixOnlyName = `${documentId.slice(0, 6)}.s.${HASH.slice(0, 8)}.mf`;

    expect(isPlausibleV3CandidateForPrefix(compatibilityName, [documentId])).toBe(false);
    expect(isPlausibleV3CandidateForPrefix(hashPrefixOnlyName, [documentId])).toBe(false);
  });

  it('rejects malformed, truncated, or non-v3 filenames regardless of prefix', () => {
    expect(isPlausibleV3CandidateForPrefix('not-a-v3-file.mf', [])).toBe(false);
    expect(isPlausibleV3CandidateForPrefix('', [])).toBe(false);
    expect(isPlausibleV3CandidateForPrefix('storage-adapter-id.automerge', [])).toBe(false);
  });
});

describe('classifyV3ChunkCandidateData', () => {
  const getKey = (): ChunkStorageKey => [getDocumentId(), 'snapshot', HASH];

  it('classifies undefined data as missing', () => {
    expect(classifyV3ChunkCandidateData(undefined, getKey())).toEqual({ kind: 'missing' });
  });

  it('classifies zero-byte data as missing, not invalid', () => {
    const result = classifyV3ChunkCandidateData(new Uint8Array(0), getKey());

    expect(result).toEqual({ kind: 'missing' });
  });

  it('classifies non-empty undecodable data as invalid', () => {
    const result = classifyV3ChunkCandidateData(new Uint8Array([1, 2, 3]), getKey());

    expect(result).toEqual({ kind: 'invalid' });
  });

  it('classifies a valid wrapper for the expected key as validSameKey', () => {
    const key = getKey();
    const data = encodeV3StorageWrapper(key, new Uint8Array([9, 9, 9]));

    const result = classifyV3ChunkCandidateData(data, key);

    expect(result.kind).toBe('validSameKey');
  });

  it('classifies a valid wrapper for a different key as validDifferentKey', () => {
    const key = getKey();
    const otherKey = getKey();
    const data = encodeV3StorageWrapper(otherKey, new Uint8Array([9, 9, 9]));

    const result = classifyV3ChunkCandidateData(data, key);

    expect(result.kind).toBe('validDifferentKey');
  });
});
