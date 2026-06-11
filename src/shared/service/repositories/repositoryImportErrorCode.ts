/**
 * Stable error codes for JSON path import failures in the repository service.
 */
export enum RepositoryImportErrorCode {
  fileReadFailed = 'repositories.importFileReadFailed',
  invalidJson = 'repositories.importInvalidJson',
  invalidDocumentFormat = 'repositories.importInvalidDocumentFormat',
}
