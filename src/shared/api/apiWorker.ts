import { defineWorker } from '@shared/lib/wrapWorker';
import { useMountDirectories } from './directories';

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- extract type
const api = defineWorker(() => {
  return {
    directories: useMountDirectories(),
  };
});

export type API = typeof api;
