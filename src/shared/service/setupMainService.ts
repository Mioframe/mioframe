import { omit } from 'es-toolkit';
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
    fileSystem: omit(useFileSystemService(), ['directoryState$']),
    repositories: omit(useRepositoriesService(), ['repositoryState$', 'documentIds$']),
    documents: useDocumentService(),
  };
};
