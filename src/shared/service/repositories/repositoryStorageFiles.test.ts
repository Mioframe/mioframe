import { describe, expect, it } from 'vitest';
import { Repo } from '@automerge/automerge-repo';
import { partialKeyToFileName, storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';
import { FSNodeType, type FSNodeStat } from '@shared/lib/virtualFileSystem';
import {
  getRegularDirectoryEntries,
  getRepositoryFacts,
  isAutomergeDocumentFileName,
  isRepositoryMarkerFileName,
  shouldHideRepositoryStorageFile,
} from './repositoryStorageFiles';

const createStat = (type: FSNodeType): FSNodeStat => ({
  type,
  capabilities: {},
});

const createDocumentStorageFileName = () => {
  const documentId = new Repo().create({}).documentId;
  const fileName = partialKeyToFileName([documentId, 'snapshot', 'hash']);

  if (!fileName) {
    throw new Error(`Failed to create repository storage file for "${documentId}"`);
  }

  return { documentId, fileName };
};

describe('getRepositoryFacts', () => {
  it('detects an initialized empty repository from the marker file', () => {
    expect(
      getRepositoryFacts([
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        ['notes.txt', createStat(FSNodeType.File)],
      ]),
    ).toEqual({
      documentIds: [],
      isInitialized: true,
    });
  });

  it('treats folders with document files as initialized even without the marker file', () => {
    const { documentId, fileName } = createDocumentStorageFileName();

    expect(
      getRepositoryFacts([
        [fileName, createStat(FSNodeType.File)],
        ['notes.txt', createStat(FSNodeType.File)],
      ]),
    ).toEqual({
      documentIds: [documentId],
      isInitialized: true,
    });
  });

  it('treats a regular folder without repository storage as uninitialized', () => {
    expect(
      getRepositoryFacts([
        ['notes.txt', createStat(FSNodeType.File)],
        ['Nested', createStat(FSNodeType.Directory)],
      ]),
    ).toEqual({
      documentIds: [],
      isInitialized: false,
    });
  });
});

describe('getRegularDirectoryEntries', () => {
  it('hides repository storage files by default', () => {
    const { fileName } = createDocumentStorageFileName();

    const result = getRegularDirectoryEntries(
      [
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        [fileName, createStat(FSNodeType.File)],
        ['plain.json', createStat(FSNodeType.File)],
      ],
      true,
    );

    expect(result.map(([name]) => name)).toEqual(['plain.json']);
  });

  it('keeps Automerge document files visible when hiding is disabled', () => {
    const { fileName } = createDocumentStorageFileName();

    const result = getRegularDirectoryEntries(
      [
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        [fileName, createStat(FSNodeType.File)],
        ['plain.json', createStat(FSNodeType.File)],
      ],
      false,
    );

    expect(result.map(([name]) => name)).toEqual([fileName, 'plain.json']);
  });
});

describe('repository storage file classifiers', () => {
  it('classifies marker and document storage names separately', () => {
    const { fileName } = createDocumentStorageFileName();

    expect(isRepositoryMarkerFileName(storageAdapterMarkerFileName)).toBe(true);
    expect(isRepositoryMarkerFileName('plain.json')).toBe(false);
    expect(isAutomergeDocumentFileName(fileName)).toBe(true);
    expect(isAutomergeDocumentFileName('plain.json')).toBe(false);
  });

  it('hides only the storage files requested by the current visibility setting', () => {
    const { fileName } = createDocumentStorageFileName();

    expect(shouldHideRepositoryStorageFile(storageAdapterMarkerFileName, true)).toBe(true);
    expect(shouldHideRepositoryStorageFile(fileName, true)).toBe(true);
    expect(shouldHideRepositoryStorageFile(fileName, false)).toBe(false);
    expect(shouldHideRepositoryStorageFile('plain.json', true)).toBe(false);
  });
});
