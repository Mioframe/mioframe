/**
 * Stable error codes for Beaver document import failures.
 */
export enum ImportDocumentErrorCode {
  fileOpenFailed = 'importDocument.fileOpenFailed',
  fileReadFailed = 'importDocument.fileReadFailed',
  invalidJson = 'importDocument.invalidJson',
  invalidDocumentFormat = 'importDocument.invalidDocumentFormat',
  documentImportFailed = 'importDocument.documentImportFailed',
}
