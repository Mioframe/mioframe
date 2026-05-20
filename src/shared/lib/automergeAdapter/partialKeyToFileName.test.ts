import { describe, expect, it } from 'vitest';
import { partialKeyToFileName } from './partialKeyToFileName';
import { storageAdapterMarkerFileName } from './storageAdapterMarkerFileName';

describe('partialKeyToFileName', () => {
  it('supports the storage adapter marker partial key', () => {
    expect(partialKeyToFileName(['storage-adapter-id'])).toBe('storage-adapter-id.automerge');
  });
});

describe('storageAdapterMarkerFileName', () => {
  it('is derived from the shared partial-key conversion path', () => {
    expect(storageAdapterMarkerFileName).toBe(partialKeyToFileName(['storage-adapter-id']));
  });
});
