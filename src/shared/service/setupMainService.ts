import { useDirectoryStoreService } from './directories';
import { useRepositoriesStoreService } from './repositories';
import { useCFRDocumentService } from './document';
import { useDatabaseDocumentService } from './databaseDocument';
import { useGoogleService } from './google';
import { useLocalFileSystemDirectoryHandleStoreService } from './directories/localFileSystemDirectoryHandleStoreService';

export const serviceId = 'mainBackgroundService';

export const setupMainService = () => {
  return {
    directoryStore: useDirectoryStoreService(),
    repositoriesStore: useRepositoriesStoreService(),
    cfrDocument: useCFRDocumentService(),
    databaseDocument: useDatabaseDocumentService(),
    google: useGoogleService(),
    localFileSystemDirectoryHandleStore:
      useLocalFileSystemDirectoryHandleStoreService(),
  };
};
