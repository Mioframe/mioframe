import { DomainError } from '@shared/lib/error';
import { FileSystemError, VfsError } from '@shared/lib/virtualFileSystem';
import type { SanitizedDiagnosticError } from './DiagnosticEvent';

/**
 * Converts an unknown boundary error into safe structured diagnostic data.
 *
 * Privacy rules enforced here:
 * - Raw `error.message` is never copied. Only structured metadata (class name, code enum) is used.
 * - Internal project-controlled errors (such as `VfsError` with an enum code) are safe to
 *   include because their codes are project-defined and cannot contain user data.
 * - `DomainError.code` is included only when present, since codes are project-controlled strings.
 * - `DOMException.name` is browser-controlled and safe (e.g. `'NotAllowedError'`, `'AbortError'`).
 * - Raw external error messages from browser APIs, storage, network, Google API, File API,
 *   Automerge, Zod, or other external libraries must never appear in the sanitized output.
 * @param error - The unknown error value caught at a boundary.
 * @returns Safe structured diagnostic data with no raw messages, paths, ids, or user data.
 */
export const sanitizeDiagnosticError = (error: unknown): SanitizedDiagnosticError => {
  if (error instanceof DOMException) {
    return {
      errorClass: 'DOMException',
      domExceptionName: error.name,
      errorClassification: classifyDomException(error),
    };
  }

  if (error instanceof VfsError) {
    return {
      errorClass: 'VfsError',
      vfsErrorCode: error.code,
      errorClassification: classifyVfsError(error),
    };
  }

  if (error instanceof DomainError) {
    const code = typeof error.code === 'string' ? error.code : undefined;
    return {
      errorClass: 'DomainError',
      ...(code !== undefined ? { domainErrorCode: code } : {}),
      errorClassification: 'unknown',
    };
  }

  if (error instanceof Error) {
    return {
      errorClass: 'Error',
      errorClassification: 'unknown',
    };
  }

  return {
    errorClass: 'unknown',
    errorClassification: 'unknown',
  };
};

const classifyDomException = (
  error: DOMException,
): SanitizedDiagnosticError['errorClassification'] => {
  if (error.name === 'NotAllowedError') return 'accessDenied';
  if (error.name === 'AbortError') return 'accessDenied';
  if (error.name === 'InvalidStateError') return 'browserFileStateChanged';
  return 'unknown';
};

const classifyVfsError = (error: VfsError): SanitizedDiagnosticError['errorClassification'] => {
  switch (error.code) {
    case FileSystemError.NoPermissions:
      return 'accessDenied';
    case FileSystemError.FileNotFound:
      return 'notFound';
    case FileSystemError.Unknown:
      return 'storageFailure';
    default:
      return 'unknown';
  }
};
