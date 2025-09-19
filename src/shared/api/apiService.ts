import { defineWorker } from '@shared/lib/wrapWorker';
import {
  useDirectoryContentService,
  useMountDirectoriesService,
} from './directories';
import { useDirectoryStoreService } from './directories/directoriesStoreService';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- extract type
const api = defineWorker(() => {
  return {
    // directories: useMountDirectoriesService(),
    // directoryContent: useDirectoryContentService(),
    directoryStore: useDirectoryStoreService(),
  };
});

export type API = typeof api;
