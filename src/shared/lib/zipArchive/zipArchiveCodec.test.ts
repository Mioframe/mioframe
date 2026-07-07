import { describe, expect, it } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { ZipArchiveErrorCode } from './zipArchiveErrorCode';
import { packZipArchive, unpackZipArchive } from './zipArchiveCodec';

describe('packZipArchive / unpackZipArchive', () => {
  it('round-trips a flat map of entries', () => {
    const entries = {
      'root/file.txt': new TextEncoder().encode('hello world'),
      'root/nested/other.txt': new TextEncoder().encode('nested content'),
    };

    const archiveBytes = packZipArchive(entries);
    const unpacked = unpackZipArchive(archiveBytes);

    expect(new TextDecoder().decode(unpacked['root/file.txt'])).toBe('hello world');
    expect(new TextDecoder().decode(unpacked['root/nested/other.txt'])).toBe('nested content');
  });

  it('round-trips an empty directory marker', () => {
    const entries = { 'root/empty/': new Uint8Array(0) };

    const unpacked = unpackZipArchive(packZipArchive(entries));

    expect(Object.keys(unpacked)).toContain('root/empty/');
  });

  it('throws a DomainError with archiveDamaged when the archive is not a valid ZIP', () => {
    const garbageBytes = new TextEncoder().encode('this is not a zip file');

    let caught: unknown;
    try {
      unpackZipArchive(garbageBytes);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: ZipArchiveErrorCode.archiveDamaged });
  });
});
