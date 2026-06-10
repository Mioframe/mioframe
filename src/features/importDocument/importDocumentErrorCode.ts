/**
 * Stable error codes for Mioframe document import failures.
 */
export enum ImportDocumentErrorCode {
  fileOpenFailed = 'importDocument.fileOpenFailed',
  fileReadFailed = 'importDocument.fileReadFailed',
  invalidJson = 'importDocument.invalidJson',
  invalidDocumentFormat = 'importDocument.invalidDocumentFormat',
  documentImportFailed = 'importDocument.documentImportFailed',
}
