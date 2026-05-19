import { partialKeyToFileName } from './partialKeyToFileName';

const maybeStorageAdapterMarkerFileName = partialKeyToFileName(['storage-adapter-id']);

if (!maybeStorageAdapterMarkerFileName) {
  throw new Error('Automerge storage adapter marker filename is invalid');
}

/**
 * Marker file written by the Automerge filesystem storage adapter to identify a Mioframe space.
 */
export const storageAdapterMarkerFileName: string = maybeStorageAdapterMarkerFileName;
