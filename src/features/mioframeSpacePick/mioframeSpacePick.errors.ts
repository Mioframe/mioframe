import { createSafeErrorCause, DomainError } from '@shared/lib/error';

const buildAddFolderError = (message: string, causeMessage: string) =>
  new DomainError(message, {
    cause: createSafeErrorCause(causeMessage),
  });

/**
 * Creates the privacy-safe error surfaced when Mioframe space creation fails.
 * @returns Domain error with a safe technical cause for Mioframe-space creation failures.
 */
export const buildCreateSpaceError = () =>
  buildAddFolderError('Could not create the Mioframe space', 'Creating the Mioframe space failed');

/**
 * Creates the privacy-safe error surfaced when opening an existing Mioframe space fails.
 * @returns Domain error with a safe technical cause for Mioframe-space open failures.
 */
export const buildOpenSpaceError = () =>
  buildAddFolderError('Could not open the Mioframe space', 'Opening the Mioframe space failed');
