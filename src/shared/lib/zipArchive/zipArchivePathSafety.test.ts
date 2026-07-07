import { describe, expect, it } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { ZipArchiveErrorCode } from './zipArchiveErrorCode';
import { sanitizeArchiveRootName, validateArchiveEntryPath } from './zipArchivePathSafety';

describe('validateArchiveEntryPath', () => {
  it('accepts a plain nested file path', () => {
    expect(validateArchiveEntryPath('folder/file.txt')).toEqual({
      relativePath: 'folder/file.txt',
      isDirectory: false,
    });
  });

  it('accepts a directory marker and reports it as a directory', () => {
    expect(validateArchiveEntryPath('folder/empty/')).toEqual({
      relativePath: 'folder/empty',
      isDirectory: true,
    });
  });

  const controlCharacterPath = `folder/${String.fromCharCode(7)}file.txt`;

  it.each([
    ['empty path', ''],
    ['absolute path', '/etc/passwd'],
    ['parent traversal', '../secret.txt'],
    ['nested parent traversal', 'folder/../../secret.txt'],
    ['backslash path', 'folder\\file.txt'],
    ['windows drive letter', 'C:/file.txt'],
    ['double slash segment', 'folder//file.txt'],
    ['control character', controlCharacterPath],
    ['bare current-dir segment', 'folder/./file.txt'],
  ])('rejects %s', (_label, rawEntryPath) => {
    let caught: unknown;
    try {
      validateArchiveEntryPath(rawEntryPath);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(DomainError);
    expect(caught).toMatchObject({ code: ZipArchiveErrorCode.unsafeEntryPath });
  });
});

describe('sanitizeArchiveRootName', () => {
  it('returns the trimmed name unchanged when already safe', () => {
    expect(sanitizeArchiveRootName('  My Repository  ')).toBe('My Repository');
  });

  it('replaces unsafe characters with underscores', () => {
    expect(sanitizeArchiveRootName('a/b\\c:d*e?f"g<h>i|j')).toBe('a_b_c_d_e_f_g_h_i_j');
  });

  it('strips trailing dots and spaces', () => {
    expect(sanitizeArchiveRootName('name...  ')).toBe('name');
  });

  it('falls back to the default name when the input is empty', () => {
    expect(sanitizeArchiveRootName('')).toBe('export');
  });

  it('falls back to a custom name when provided', () => {
    expect(sanitizeArchiveRootName('   ', 'root')).toBe('root');
  });

  it('falls back when sanitizing leaves nothing usable', () => {
    expect(sanitizeArchiveRootName('...')).toBe('export');
  });
});
