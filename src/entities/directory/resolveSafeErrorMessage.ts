import { DomainError } from '@shared/lib/error';

/**
 * Resolves a user-facing error message from an arbitrary error value.
 * Returns the `DomainError.message` when the error is a `DomainError`;
 * otherwise returns a safe project-controlled fallback so that raw
 * exception messages (which may contain paths, IDs, or external data)
 * never reach the UI.
 * @param error - The error thrown by a read operation.
 * @param fallbackMessage - Safe message to use when the error is not a `DomainError`.
 * @returns A user-safe message string, or `undefined` when no error occurred.
 */
export const resolveSafeErrorMessage = (
  error: unknown,
  fallbackMessage = 'Error reading directory',
): string | undefined => {
  if (error instanceof DomainError) {
    return error.message;
  }

  return fallbackMessage;
};
