import { useDirectoryStoreService } from './directories/directoriesStoreService';
import { useRepositoriesStoreService } from './repositories';
import { useCFRDocumentService } from './document';
import { useDatabaseDocumentService } from './databaseDocument';

export const serviceId = 'mainBackgroundService';

export const setupMainService = () => {
  return {
    directoryStore: useDirectoryStoreService(),
    repositoriesStore: useRepositoriesStoreService(),
    cfrDocument: useCFRDocumentService(),
    databaseDocument: useDatabaseDocumentService(),
  };
};
