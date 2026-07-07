/**
 * Stable domain error codes for local file-system operations.
 */
export enum FileSystemDomainErrorCode {
  directoryMoveFailed = 'directory-move-failed',
  entryMoveFailed = 'entry-move-failed',
  directoryRemoveFailed = 'directory-remove-failed',
  directoryCopyFailed = 'directory-copy-failed',
  entryCopyFailed = 'entry-copy-failed',
  /** `saveStreamWithPicker`'s Blob fallback path exceeded its bounded buffer size. */
  saveStreamFallbackTooLarge = 'save-stream-fallback-too-large',
}
