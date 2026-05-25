import { describe, expect, it } from 'vitest';
import { storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';
import { FSNodeType, type FSNodeStat } from '@shared/lib/virtualFileSystem';
import {
  getMioframeSpaceDirectoryState,
  getRegularDirectoryEntries,
  hasMioframeMarkerFile,
  isMioframeServiceFile,
} from './classifyMioframeSpaceDirectory';

const createStat = (type: FSNodeType): FSNodeStat => ({
  type,
  capabilities: {},
});

describe('hasMioframeMarkerFile', () => {
  it('detects the marker file when it is present as a file', () => {
    expect(
      hasMioframeMarkerFile([
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        ['notes.txt', createStat(FSNodeType.File)],
      ]),
    ).toBe(true);
  });

  it('treats the marker as present only when it is a file', () => {
    expect(
      hasMioframeMarkerFile([[storageAdapterMarkerFileName, createStat(FSNodeType.Directory)]]),
    ).toBe(false);
  });
});

describe('getMioframeSpaceDirectoryState', () => {
  it('returns a regular folder when there is no marker and no document ids', () => {
    expect(
      getMioframeSpaceDirectoryState({
        hasMarkerFile: false,
        documentIds: [],
      }),
    ).toBe('regularFolder');
  });

  it('returns an empty Mioframe space when the marker exists without documents', () => {
    expect(
      getMioframeSpaceDirectoryState({
        hasMarkerFile: true,
        documentIds: [],
      }),
    ).toBe('emptyMioframeSpace');
  });

  it('treats folders with document ids as Mioframe spaces even without a marker file', () => {
    expect(
      getMioframeSpaceDirectoryState({
        hasMarkerFile: false,
        documentIds: ['test-doc-id'],
      }),
    ).toBe('mioframeSpaceWithDocuments');
  });
});

describe('getRegularDirectoryEntries', () => {
  it('hides Mioframe service files by default', () => {
    const result = getRegularDirectoryEntries({
      directoryEntries: [
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        ['test-doc-id.snapshot.automerge', createStat(FSNodeType.File)],
        ['plain.json', createStat(FSNodeType.File)],
      ],
    });

    expect(result.map(([name]) => name)).toEqual(['plain.json']);
  });

  it('keeps Automerge document files visible when hiding is disabled', () => {
    const result = getRegularDirectoryEntries({
      directoryEntries: [
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        ['test-doc-id.snapshot.automerge', createStat(FSNodeType.File)],
        ['plain.json', createStat(FSNodeType.File)],
      ],
      hideAutomergeFiles: false,
    });

    expect(result.map(([name]) => name)).toEqual(['test-doc-id.snapshot.automerge', 'plain.json']);
  });
});

describe('isMioframeServiceFile', () => {
  it('matches the marker file and optional Automerge document files', () => {
    expect(isMioframeServiceFile(storageAdapterMarkerFileName, true)).toBe(true);
    expect(isMioframeServiceFile('test-doc-id.snapshot.automerge', true)).toBe(true);
    expect(isMioframeServiceFile('test-doc-id.snapshot.automerge', false)).toBe(false);
    expect(isMioframeServiceFile('plain.json', true)).toBe(false);
  });
});
