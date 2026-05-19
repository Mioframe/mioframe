import { createSafeErrorCause, DomainError } from '@shared/lib/error';

const buildAddFolderError = (message: string, causeMessage: string) =>
  new DomainError(message, {
    cause: createSafeErrorCause(causeMessage),
  });

export const buildCreateSpaceError = () =>
  buildAddFolderError('Could not create the Mioframe space', 'Creating the Mioframe space failed');

export const buildOpenSpaceError = () =>
  buildAddFolderError('Could not open the Mioframe space', 'Opening the Mioframe space failed');
