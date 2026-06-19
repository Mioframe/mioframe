import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import { encodePreferredV3FileName } from './filenameCodecV3';
import type { ChunkStorageKey } from './types';
import { isPlausibleV3CandidateForPrefix } from './v3StoragePolicy';

const HASH = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';

const getDocumentId = () => new Repo().create({}).documentId;

describe('isPlausibleV3CandidateForPrefix', () => {
  it('does not throw and matches every plausible v3 candidate for an empty prefix', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePreferredV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(() => isPlausibleV3CandidateForPrefix(fileName, [])).not.toThrow();
    expect(isPlausibleV3CandidateForPrefix(fileName, [])).toBe(true);
  });

  it('rejects the marker prefix without decoding v3 candidates', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePreferredV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPlausibleV3CandidateForPrefix(fileName, ['storage-adapter-id'])).toBe(false);
  });

  it('matches a documentId prefix for the same document', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePreferredV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPlausibleV3CandidateForPrefix(fileName, [documentId])).toBe(true);
  });

  it('matches a documentId+kind prefix for the same document and kind', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePreferredV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPlausibleV3CandidateForPrefix(fileName, [documentId, 'snapshot'])).toBe(true);
    expect(isPlausibleV3CandidateForPrefix(fileName, [documentId, 'incremental'])).toBe(false);
  });

  it('matches a full documentId+kind+hash prefix for the same chunk key', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePreferredV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPlausibleV3CandidateForPrefix(fileName, key)).toBe(true);
  });

  it('rejects an unrelated documentId prefix', () => {
    const documentId = getDocumentId();
    const otherDocumentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const fileName = encodePreferredV3FileName(key);

    if (!fileName) {
      throw new Error('Expected v3 filename');
    }

    expect(isPlausibleV3CandidateForPrefix(fileName, [otherDocumentId])).toBe(false);
  });

  it('rejects malformed, truncated, or non-v3 filenames regardless of prefix', () => {
    expect(isPlausibleV3CandidateForPrefix('not-a-v3-file.mf', [])).toBe(false);
    expect(isPlausibleV3CandidateForPrefix('', [])).toBe(false);
    expect(isPlausibleV3CandidateForPrefix('storage-adapter-id.automerge', [])).toBe(false);
  });
});
