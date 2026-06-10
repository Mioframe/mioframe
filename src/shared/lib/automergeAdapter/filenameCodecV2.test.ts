import { describe, expect, it } from 'vitest';
import { decodeV2FileName, encodeStorageKeyToV2FileName, isV2FileName } from './filenameCodecV2';
import { fileNameToPartialKey } from './fileNameToPartialKey';

// Known failing legacy filename from PR #85 diagnostics.
const LEGACY_SNAPSHOT_FILENAME =
  '47ySCH1y6Amhs2k5P1eQb2u74MHg_snapshot_0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2.automerge';
const KNOWN_DOC_ID = '47ySCH1y6Amhs2k5P1eQb2u74MHg';
const KNOWN_HASH = '0df10d48afdaa0df1a484b006e4854cec8640d416745ce0cc874c07027b69cc2';

const requireV2 = (docId: string, kind: 'snapshot' | 'incremental', hash: string): string => {
  const name = encodeStorageKeyToV2FileName(docId, kind, hash);
  if (!name) throw new Error('Expected v2 filename to be defined');
  return name;
};

describe('encodeStorageKeyToV2FileName', () => {
  it('produces a compact snapshot filename from the known-failing legacy key', () => {
    const v2 = requireV2(KNOWN_DOC_ID, 'snapshot', KNOWN_HASH);
    expect(v2).toMatch(/^47ySCH1y6Amhs2k5P1eQb2u74MHg~s~[A-Za-z0-9_-]{43}\.am$/);
  });

  it('produces a compact incremental filename', () => {
    const v2 = requireV2(KNOWN_DOC_ID, 'incremental', KNOWN_HASH);
    expect(v2).toMatch(/^47ySCH1y6Amhs2k5P1eQb2u74MHg~i~[A-Za-z0-9_-]{43}\.am$/);
  });

  it('v2 snapshot filename is shorter than the known failing 112-char legacy filename', () => {
    const v2 = requireV2(KNOWN_DOC_ID, 'snapshot', KNOWN_HASH);
    expect(LEGACY_SNAPSHOT_FILENAME).toHaveLength(112);
    expect(v2.length).toBeLessThan(112);
    expect(v2.length).toBeLessThanOrEqual(80);
  });

  it('v2 filename contains no path separators or traversal characters', () => {
    const v2 = requireV2(KNOWN_DOC_ID, 'snapshot', KNOWN_HASH);
    expect(v2).not.toContain('/');
    expect(v2).not.toContain('\\');
    expect(v2).not.toContain('..');
  });

  it('v2 filename is ASCII-only', () => {
    const v2 = requireV2(KNOWN_DOC_ID, 'snapshot', KNOWN_HASH);
    // codePointAt returns undefined only for empty string; each char in Array.from is non-empty.
    expect(Array.from(v2).every((ch) => (ch.codePointAt(0) ?? 200) < 128)).toBe(true);
  });

  it('encoding is deterministic (same inputs produce the same output)', () => {
    const a = encodeStorageKeyToV2FileName(KNOWN_DOC_ID, 'snapshot', KNOWN_HASH);
    const b = encodeStorageKeyToV2FileName(KNOWN_DOC_ID, 'snapshot', KNOWN_HASH);
    expect(a).toBe(b);
  });

  it('returns undefined for a non-hex hash', () => {
    expect(encodeStorageKeyToV2FileName(KNOWN_DOC_ID, 'snapshot', 'not-hex')).toBeUndefined();
  });

  it('returns undefined for a hash shorter than 64 chars', () => {
    expect(
      encodeStorageKeyToV2FileName(KNOWN_DOC_ID, 'snapshot', KNOWN_HASH.slice(0, 32)),
    ).toBeUndefined();
  });

  it('returns undefined for a hash longer than 64 chars', () => {
    expect(
      encodeStorageKeyToV2FileName(KNOWN_DOC_ID, 'snapshot', KNOWN_HASH + 'aa'),
    ).toBeUndefined();
  });
});

describe('decodeV2FileName', () => {
  it('decodes a v2 snapshot filename to the original logical key parts', () => {
    const v2 = requireV2(KNOWN_DOC_ID, 'snapshot', KNOWN_HASH);
    const decoded = decodeV2FileName(v2);
    expect(decoded).toBeDefined();
    if (!decoded) return;
    const [docId, kind, hexHash] = decoded;
    expect(docId).toBe(KNOWN_DOC_ID);
    expect(kind).toBe('snapshot');
    expect(hexHash).toBe(KNOWN_HASH);
  });

  it('decodes a v2 incremental filename', () => {
    const v2 = requireV2(KNOWN_DOC_ID, 'incremental', KNOWN_HASH);
    const decoded = decodeV2FileName(v2);
    expect(decoded?.[1]).toBe('incremental');
  });

  it('round-trips encode → decode for both kinds', () => {
    for (const kind of ['snapshot', 'incremental'] as const) {
      const v2 = requireV2(KNOWN_DOC_ID, kind, KNOWN_HASH);
      const decoded = decodeV2FileName(v2);
      expect(decoded).toBeDefined();
      if (!decoded) return;
      expect(decoded[0]).toBe(KNOWN_DOC_ID);
      expect(decoded[1]).toBe(kind);
      expect(decoded[2]).toBe(KNOWN_HASH);
    }
  });

  it('returns undefined for a legacy filename', () => {
    expect(decodeV2FileName(LEGACY_SNAPSHOT_FILENAME)).toBeUndefined();
  });

  it('returns undefined for an empty string', () => {
    expect(decodeV2FileName('')).toBeUndefined();
  });

  it('returns undefined for a filename with wrong extension', () => {
    const v2Like = `${KNOWN_DOC_ID}~s~${'a'.repeat(43)}.automerge`;
    expect(decodeV2FileName(v2Like)).toBeUndefined();
  });

  it('returns undefined for a filename with invalid hash length', () => {
    const tooShort = `${KNOWN_DOC_ID}~s~${'a'.repeat(20)}.am`;
    expect(decodeV2FileName(tooShort)).toBeUndefined();
  });

  it('returns undefined for a filename with invalid base64url chars in hash', () => {
    const withInvalidChar = `${KNOWN_DOC_ID}~s~${'a'.repeat(42)}+.am`;
    expect(decodeV2FileName(withInvalidChar)).toBeUndefined();
  });
});

describe('isV2FileName', () => {
  it('returns true for a valid v2 snapshot filename', () => {
    const v2 = requireV2(KNOWN_DOC_ID, 'snapshot', KNOWN_HASH);
    expect(isV2FileName(v2)).toBe(true);
  });

  it('returns false for a legacy filename', () => {
    expect(isV2FileName(LEGACY_SNAPSHOT_FILENAME)).toBe(false);
  });

  it('returns false for the marker file', () => {
    expect(isV2FileName('storage-adapter-id.automerge')).toBe(false);
  });
});

describe('fileNameToPartialKey (v2 integration)', () => {
  it('parses a v2 snapshot filename to the same logical key as the legacy snapshot filename', () => {
    const v2 = requireV2(KNOWN_DOC_ID, 'snapshot', KNOWN_HASH);
    const legacyKey = fileNameToPartialKey(LEGACY_SNAPSHOT_FILENAME);
    const v2Key = fileNameToPartialKey(v2);

    expect(legacyKey).toBeDefined();
    expect(v2Key).toBeDefined();
    expect(v2Key).toEqual(legacyKey);
  });

  it('parses a v2 incremental filename to the expected logical key', () => {
    const legacyIncremental = `${KNOWN_DOC_ID}_incremental_${KNOWN_HASH}.automerge`;
    const v2 = requireV2(KNOWN_DOC_ID, 'incremental', KNOWN_HASH);

    const legacyKey = fileNameToPartialKey(legacyIncremental);
    const v2Key = fileNameToPartialKey(v2);

    expect(v2Key).toEqual(legacyKey);
  });

  it('returns undefined for an invalid v2 filename', () => {
    expect(fileNameToPartialKey(`${KNOWN_DOC_ID}~s~tooshort.am`)).toBeUndefined();
    expect(fileNameToPartialKey(`${KNOWN_DOC_ID}~z~${'a'.repeat(43)}.am`)).toBeUndefined();
  });

  it('continues to parse legacy filenames correctly', () => {
    const key = fileNameToPartialKey(LEGACY_SNAPSHOT_FILENAME);
    expect(key).toEqual([KNOWN_DOC_ID, 'snapshot', KNOWN_HASH]);
  });

  it('continues to return undefined for unrelated filenames', () => {
    expect(fileNameToPartialKey('random-file.txt')).toBeUndefined();
    expect(fileNameToPartialKey('mioframe-write-probe.automerge')).toBeUndefined();
  });
});
