import { useDocumentService } from './document';
import { useDatabaseDocumentService } from './databaseDocument';
import { useGoogleService } from './google';
import { useFileSystemService } from './fileSystem';
import { useRepositoriesService } from './repositories';

export const serviceId = 'mainBackgroundService';

export const setupMainService = () => {
  return {
    databaseDocument: useDatabaseDocumentService(),
    google: useGoogleService(),
    fileSystem: useFileSystemService(),
    repositories: useRepositoriesService(),
    documents: useDocumentService(),
  };
};
