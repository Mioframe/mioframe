import {
  WebFileSystemAccessRequiredError,
  type WebFileSystemAccessRequiredDetails,
} from './WebFileSystemAccessRequiredError';

/**
 * Creates a provider-owned access-required error from safe service metadata.
 * @param details - Safe pending request metadata created by the owning service.
 * @returns Provider-owned remembered-local-space access error.
 */
export const createWebFileSystemAccessRequiredError = (
  details: WebFileSystemAccessRequiredDetails,
) => new WebFileSystemAccessRequiredError(details);
