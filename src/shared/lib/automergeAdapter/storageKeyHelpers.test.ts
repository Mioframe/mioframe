import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it } from 'vitest';
import {
  selectReadableStorageEntries,
  storageKeyEquals,
  storageKeyStartsWith,
} from './storageKeyHelpers';
import { encodeStorageKeyToV2FileName } from './filenameCodecV2';

const HASH_A = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';
const HASH_B = '1af20e59befbb1e02b595c117f9965dfd7751e527856df1dd985d18138c7add3';

// String literal used for legacy filename construction and toEqual expectations only.
// Not passed as PartialStorageKey (which requires a branded DocumentId).
const DOC_ID_STR = '47ySCH1y6Amhs2k5P1eQb2u74MHg';

const getDocumentId = () => new Repo().create({}).documentId;

const requireV2 = (docId: string, kind: 'snapshot' | 'incremental', hash: string): string => {
  const name = encodeStorageKeyToV2FileName(docId, kind, hash);
  if (!name) throw new Error('Expected v2 filename');
  return name;
};

describe('storageKeyEquals', () => {
  it('returns true for identical keys', () => {
    const docId = getDocumentId();
    expect(storageKeyEquals([docId, 'snapshot', HASH_A], [docId, 'snapshot', HASH_A])).toBe(true);
  });

  it('returns false when kinds differ', () => {
    const docId = getDocumentId();
    expect(storageKeyEquals([docId, 'snapshot', HASH_A], [docId, 'incremental', HASH_A])).toBe(
      false,
    );
  });

  it('returns false when lengths differ', () => {
    const docId = getDocumentId();
    expect(storageKeyEquals([docId], [docId, 'snapshot', HASH_A])).toBe(false);
  });
});

describe('storageKeyStartsWith', () => {
  it('returns true when key starts with prefix', () => {
    const docId = getDocumentId();
    expect(storageKeyStartsWith([docId, 'snapshot', HASH_A], [docId])).toBe(true);
    expect(storageKeyStartsWith([docId, 'snapshot', HASH_A], [docId, 'snapshot'])).toBe(true);
  });

  it('returns true for equal key and prefix', () => {
    const docId = getDocumentId();
    expect(storageKeyStartsWith([docId, 'snapshot', HASH_A], [docId, 'snapshot', HASH_A])).toBe(
      true,
    );
  });

  it('returns false when prefix is longer than key', () => {
    const docId = getDocumentId();
    expect(storageKeyStartsWith([docId], [docId, 'snapshot', HASH_A])).toBe(false);
  });

  it('returns false when elements differ', () => {
    const docId = getDocumentId();
    expect(storageKeyStartsWith([docId, 'incremental', HASH_A], [docId, 'snapshot'])).toBe(false);
  });
});

describe('selectReadableStorageEntries', () => {
  it('parses a v2 filename to its logical key', () => {
    const v2 = requireV2(DOC_ID_STR, 'snapshot', HASH_A);
    const entries = selectReadableStorageEntries([v2]);
    expect(entries.size).toBe(1);
    const entry = [...entries.values()][0];
    expect(entry?.key).toEqual([DOC_ID_STR, 'snapshot', HASH_A]);
    expect(entry?.isV2).toBe(true);
  });

  it('parses a legacy filename to its logical key', () => {
    const legacy = `${DOC_ID_STR}_snapshot_${HASH_A}.automerge`;
    const entries = selectReadableStorageEntries([legacy]);
    expect(entries.size).toBe(1);
    const entry = [...entries.values()][0];
    expect(entry?.key).toEqual([DOC_ID_STR, 'snapshot', HASH_A]);
    expect(entry?.isV2).toBe(false);
  });

  it('skips unrecognised filenames', () => {
    const entries = selectReadableStorageEntries(['random.txt', 'not-a-valid-key.automerge']);
    expect(entries.size).toBe(0);
  });

  it('deduplicates by logical key, keeping first-seen when both are legacy', () => {
    const legacy = `${DOC_ID_STR}_snapshot_${HASH_A}.automerge`;
    const entries = selectReadableStorageEntries([legacy, legacy]);
    expect(entries.size).toBe(1);
  });

  it('prefers v2 over legacy when both exist for the same logical key', () => {
    const legacy = `${DOC_ID_STR}_snapshot_${HASH_A}.automerge`;
    const v2 = requireV2(DOC_ID_STR, 'snapshot', HASH_A);
    const entries = selectReadableStorageEntries([legacy, v2]);
    expect(entries.size).toBe(1);
    expect([...entries.values()][0]?.isV2).toBe(true);
    expect([...entries.values()][0]?.name).toBe(v2);
  });

  it('prefers v2 even when it appears before legacy in iteration order', () => {
    const legacy = `${DOC_ID_STR}_snapshot_${HASH_A}.automerge`;
    const v2 = requireV2(DOC_ID_STR, 'snapshot', HASH_A);
    const entries = selectReadableStorageEntries([v2, legacy]);
    expect(entries.size).toBe(1);
    expect([...entries.values()][0]?.isV2).toBe(true);
  });

  it('keeps distinct keys when different hashes are present', () => {
    const v2a = requireV2(DOC_ID_STR, 'snapshot', HASH_A);
    const v2b = requireV2(DOC_ID_STR, 'incremental', HASH_B);
    const entries = selectReadableStorageEntries([v2a, v2b]);
    expect(entries.size).toBe(2);
  });

  it('includes the marker file key', () => {
    const entries = selectReadableStorageEntries(['storage-adapter-id.automerge']);
    expect(entries.size).toBe(1);
    expect([...entries.values()][0]?.key).toEqual(['storage-adapter-id']);
  });
});
