import { useDocumentService } from './document';
import { useDatabaseDocumentService } from './databaseDocument';
import { useGoogleService } from './google';
import { useFileSystemService } from './fileSystem';
import { useRepositoriesService } from './repositories';

export const serviceId = 'mainBackgroundService';

/**
 * Assembles the background worker's public service surface.
 * @returns The service objects published to `useMainServiceClient()`.
 */
export const setupMainService = () => {
  return {
    databaseDocument: useDatabaseDocumentService(),
    google: useGoogleService(),
    fileSystem: useFileSystemService(),
    repositories: useRepositoriesService(),
    documents: useDocumentService(),
  };
};
