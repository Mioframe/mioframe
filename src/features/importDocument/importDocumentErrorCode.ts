/**
 * Stable error codes for Beaver document import failures.
 */
export enum ImportDocumentErrorCode {
  fileOpenFailed = 'file-open-failed',
  fileReadFailed = 'file-read-failed',
  invalidJson = 'invalid-json',
  invalidDocumentFormat = 'invalid-document-format',
  documentImportFailed = 'document-import-failed',
}
