import { defineWorker } from '@shared/lib/wrapWorker';
import { useDirectoryStoreService } from './directories/directoriesStoreService';
import { useRepositoriesStoreService } from './repositories';
import { useCFRDocumentService } from './document';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- extract type
const api = defineWorker(() => {
  return {
    directoryStore: useDirectoryStoreService(),
    repositoriesStore: useRepositoriesStoreService(),
    cfrDocument: useCFRDocumentService(),
  };
});

export type API = typeof api;
