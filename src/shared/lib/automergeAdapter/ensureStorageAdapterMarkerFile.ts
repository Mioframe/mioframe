import { storageAdapterMarkerFileName } from './storageAdapterMarkerFileName';

/**
 * Ensures the Automerge filesystem marker file exists inside a browser directory handle.
 * @param directoryHandle - Raw browser directory handle that should be recognized as a Mioframe space.
 */
export const ensureStorageAdapterMarkerFile = async (
  directoryHandle: FileSystemDirectoryHandle,
) => {
  const markerHandle = await directoryHandle.getFileHandle(storageAdapterMarkerFileName, {
    create: true,
  });
  const writable = await markerHandle.createWritable();

  await writable.close();
};
