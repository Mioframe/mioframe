export { createVFSAdapter } from './createVFSAdapter';
export {
  createRetryingStorageAdapter,
  type RetryingStorageAdapterFailureClassification,
  type RetryingStorageAdapterFlushResult,
  type RetryingStorageAdapterOptions,
  type RetryingStorageAdapterSaveFailureInfo,
} from './createRetryingStorageAdapter';
export { createFSStorageAdapter } from './createFSStorageAdapter';
export {
  zodAutomergeFileName,
  KEY_SEPARATE,
  zodChangedType,
  zodHash,
  zodPartialAutomergeFileName,
  zodPartialStorageKey,
  zodStorageKey,
} from './types';
export type * from './types';
export { fileNameToPartialKey, isAutomergeStorageFileName } from './fileNameToPartialKey';
export { getPartialStorageKeyFileNamePrefix } from './getPartialStorageKeyFileNamePrefix';
export { partialKeyToFileName } from './partialKeyToFileName';
export { storageAdapterMarkerFileName } from './storageAdapterMarkerFileName';
export {
  encodeStorageKeyToV2FileName,
  decodeV2FileName,
  isV2FileName,
  V2_FILE_EXTENSION,
  V2_SEPARATOR,
} from './filenameCodecV2';
export {
  storageKeyToId,
  storageKeyHasPrefix,
  toWritableStorageFileName,
  selectReadableStorageEntries,
} from './storageKeyHelpers';
export {
  decodeV3CandidateFileName,
  encodePreferredV3FileName,
  encodeV3FileNameWithSuffix,
  V3_DOC_PREFIX_LENGTH,
  V3_FILE_EXTENSION,
  V3_HASH_PREFIX_LENGTH,
  V3_MAX_FILE_NAME_LENGTH,
} from './filenameCodecV3';
export {
  collectStorageFileNamesForKey,
  collectStorageFileNamesForPrefix,
  discoverStorageDocumentIds,
  isPlausibleRepositoryStorageCandidateFileName,
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- compatibility re-export
  isRepositoryStorageCandidateFileName,
  loadStorageEntriesByPrefix,
  loadStorageEntry,
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- compatibility re-export
  loadStorageChunk,
  // eslint-disable-next-line @typescript-eslint/no-deprecated -- compatibility re-export
  loadStorageChunksByPrefix,
  removeStorageEntriesByPrefix,
  removeStorageEntry,
  resolveStorageChunkWriteTarget,
  saveStorageEntry,
  type MutableStorageFilePolicyIo,
  type ReadOnlyStorageFilePolicyIo,
  type ReadOnlyStorageFilePolicyIo as StorageFilePolicyIo,
} from './storageFilePolicy';
