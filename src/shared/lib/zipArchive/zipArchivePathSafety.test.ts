import { describe, expect, it } from 'vitest';
import { DomainError } from '@shared/lib/error';
import { ZipArchiveErrorCode } from './zipArchiveErrorCode';
import { resolveSafeArchiveEntryTarget, validateArchiveEntryPath } from './zipArchivePathSafety';

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

describe('resolveSafeArchiveEntryTarget', () => {
  it('resolves a nested file path to a normalized target under the target directory', () => {
    expect(resolveSafeArchiveEntryTarget('/target', 'folder/file.txt')).toEqual({
      targetPath: '/target/folder/file.txt',
      isDirectory: false,
    });
  });

  it('resolves a directory marker to a normalized target directory path', () => {
    expect(resolveSafeArchiveEntryTarget('/target', 'folder/empty/')).toEqual({
      targetPath: '/target/folder/empty',
      isDirectory: true,
    });
  });

  it.each([
    ['parent traversal', '../secret.txt'],
    ['nested parent traversal', 'folder/../../secret.txt'],
    ['absolute path', '/etc/passwd'],
  ])(
    'rejects %s before it can be resolved against the target directory',
    (_label, rawEntryPath) => {
      let caught: unknown;
      try {
        resolveSafeArchiveEntryTarget('/target', rawEntryPath);
      } catch (error) {
        caught = error;
      }

      expect(caught).toBeInstanceOf(DomainError);
      expect(caught).toMatchObject({ code: ZipArchiveErrorCode.unsafeEntryPath });
    },
  );

  it('resolves a file entry and a directory-marker entry for the same name to the same target path', () => {
    // Cross-entry duplicate/type-conflict detection over these resolved paths is a plan-level
    // concern (see `repositoryZipImport.test.ts`); this only confirms both entries normalize to
    // the same target path so that plan-level check has a stable, comparable key to work with.
    const file = resolveSafeArchiveEntryTarget('/target', 'folder/name');
    const directory = resolveSafeArchiveEntryTarget('/target', 'folder/name/');

    expect(file.targetPath).toBe(directory.targetPath);
    expect(file.isDirectory).toBe(false);
    expect(directory.isDirectory).toBe(true);
  });
});
