import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import { encodePrimaryV3FileName } from './filenameCodecV3';
import type { ChunkStorageKey } from './types';
import {
  getCompatibilityV3CandidateNamesForKey,
  isPlausibleV3CandidateForPrefix,
  isPrimaryV3CandidateForKey,
} from './v3StoragePolicy';

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

describe('getCompatibilityV3CandidateNamesForKey', () => {
  it('matches manual/copied/suffixed compatibility names for the key', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const docPrefix = documentId.slice(0, 6);
    const hashPrefix = HASH.slice(0, 8);
    const names = [
      `${docPrefix}.s.${hashPrefix}.mf`,
      `${docPrefix}.s.${hashPrefix}.1.mf`,
      `${docPrefix}.s.${hashPrefix} - copy.mf`,
    ];

    expect(getCompatibilityV3CandidateNamesForKey(names, key)).toEqual([...names].sort());
  });

  it('does not match the primary filename for the same key', () => {
    const documentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const primaryName = encodePrimaryV3FileName(key);

    if (!primaryName) {
      throw new Error('Expected v3 filename');
    }

    expect(getCompatibilityV3CandidateNamesForKey([primaryName], key)).toEqual([]);
  });

  it('rejects candidates for an unrelated documentId or hash', () => {
    const documentId = getDocumentId();
    const otherDocumentId = getDocumentId();
    const key: ChunkStorageKey = [documentId, 'snapshot', HASH];
    const otherDocName = `${otherDocumentId.slice(0, 6)}.s.${HASH.slice(0, 8)}.mf`;
    const otherHashName = `${documentId.slice(0, 6)}.s.ffffffff.mf`;

    expect(getCompatibilityV3CandidateNamesForKey([otherDocName, otherHashName], key)).toEqual([]);
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

  it('matches compatibility candidates the same way as primary candidates', () => {
    const documentId = getDocumentId();
    const compatibilityName = `${documentId.slice(0, 6)}.s.${HASH.slice(0, 8)} - copy.mf`;

    expect(isPlausibleV3CandidateForPrefix(compatibilityName, [documentId])).toBe(true);
  });

  it('rejects malformed, truncated, or non-v3 filenames regardless of prefix', () => {
    expect(isPlausibleV3CandidateForPrefix('not-a-v3-file.mf', [])).toBe(false);
    expect(isPlausibleV3CandidateForPrefix('', [])).toBe(false);
    expect(isPlausibleV3CandidateForPrefix('storage-adapter-id.automerge', [])).toBe(false);
  });
});
