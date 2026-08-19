import { useDocumentService } from './document';
import { useDatabaseDocumentService } from './databaseDocument';
import { useGoogleService } from './google';
import { useFileSystemService } from './fileSystem';
import { useRepositoriesService } from './repositories';

export const serviceId = 'mainBackgroundService';

/**
 * Narrows the file-system service to the public worker/client surface, excluding
 * background-only repository lifecycle registration capabilities (write-recovery handler
 * registration and confirmed-replacement lease-provider registration). Internal services keep
 * full access through `useFileSystemService()` directly.
 * @param fileSystemService - Object structurally shaped like the file-system service, with at
 * least the two internal registration capabilities to exclude.
 * @returns The file-system service without internal lifecycle registration capabilities.
 */
export const toPublicFileSystemService = <
  T extends {
    registerConfirmedReplacementLeaseProvider: unknown;
    registerWriteAccessRecoveryHandler: unknown;
  },
>(
  fileSystemService: T,
) => {
  const {
    registerConfirmedReplacementLeaseProvider: _registerConfirmedReplacementLeaseProvider,
    registerWriteAccessRecoveryHandler: _registerWriteAccessRecoveryHandler,
    ...publicFileSystemService
  } = fileSystemService;

  return publicFileSystemService;
};

/**
 * Assembles the background worker's public service surface.
 * @returns The service objects published to `useMainServiceClient()`.
 */
export const setupMainService = () => {
  return {
    databaseDocument: useDatabaseDocumentService(),
    google: useGoogleService(),
    fileSystem: toPublicFileSystemService(useFileSystemService()),
    repositories: useRepositoriesService(),
    documents: useDocumentService(),
  };
};
