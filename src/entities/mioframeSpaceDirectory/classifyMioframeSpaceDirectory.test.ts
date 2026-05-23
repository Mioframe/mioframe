import { describe, expect, it } from 'vitest';
import { storageAdapterMarkerFileName } from '@shared/lib/automergeAdapter';
import { FSNodeType, type FSNodeStat } from '@shared/lib/virtualFileSystem';
import { classifyMioframeSpaceDirectory } from './classifyMioframeSpaceDirectory';

const createStat = (type: FSNodeType): FSNodeStat => ({
  type,
  capabilities: {},
});

describe('classifyMioframeSpaceDirectory', () => {
  it('classifies a regular folder when the marker is absent', () => {
    const result = classifyMioframeSpaceDirectory({
      directoryEntries: [
        ['notes.txt', createStat(FSNodeType.File)],
        ['Projects', createStat(FSNodeType.Directory)],
      ],
      documentIds: [],
    });

    expect(result.state).toBe('regularFolder');
    expect(result.hasMarkerFile).toBe(false);
    expect(result.visibleFileEntries.map(([name]) => name)).toEqual(['notes.txt', 'Projects']);
  });

  it('classifies inconsistent Mioframe data when document ids exist without the marker', () => {
    const result = classifyMioframeSpaceDirectory({
      directoryEntries: [['notes.txt', createStat(FSNodeType.File)]],
      documentIds: ['test-doc-id'],
    });

    expect(result.state).toBe('inconsistentMioframeData');
    expect(result.hasMarkerFile).toBe(false);
    expect(result.visibleFileEntries.map(([name]) => name)).toEqual(['notes.txt']);
  });

  it('classifies an empty Mioframe space when the marker exists without documents', () => {
    const result = classifyMioframeSpaceDirectory({
      directoryEntries: [
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        ['notes.txt', createStat(FSNodeType.File)],
      ],
      documentIds: [],
    });

    expect(result.state).toBe('emptyMioframeSpace');
    expect(result.hasMarkerFile).toBe(true);
    expect(result.visibleFileEntries.map(([name]) => name)).toEqual(['notes.txt']);
  });

  it('classifies a Mioframe space with documents when the marker and documents exist', () => {
    const result = classifyMioframeSpaceDirectory({
      directoryEntries: [
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        ['test-doc-id.incremental.automerge', createStat(FSNodeType.File)],
        ['Folder', createStat(FSNodeType.Directory)],
      ],
      documentIds: ['test-doc-id'],
    });

    expect(result.state).toBe('mioframeSpaceWithDocuments');
    expect(result.visibleFileEntries.map(([name]) => name)).toEqual(['Folder']);
  });

  it('hides Mioframe service files from the regular files section by default', () => {
    const result = classifyMioframeSpaceDirectory({
      directoryEntries: [
        [storageAdapterMarkerFileName, createStat(FSNodeType.File)],
        ['test-doc-id.snapshot.automerge', createStat(FSNodeType.File)],
        ['plain.json', createStat(FSNodeType.File)],
      ],
      documentIds: ['test-doc-id'],
    });

    expect(result.visibleFileEntries.map(([name]) => name)).toEqual(['plain.json']);
  });
});
