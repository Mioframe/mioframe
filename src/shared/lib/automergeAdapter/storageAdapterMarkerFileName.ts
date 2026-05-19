import { partialKeyToFileName } from './partialKeyToFileName';

/**
 * Marker file written by the Automerge filesystem storage adapter to identify a Mioframe space.
 */
export const storageAdapterMarkerFileName = partialKeyToFileName(['storage-adapter-id']);
