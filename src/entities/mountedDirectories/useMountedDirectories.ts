import { createGlobalState } from '@vueuse/core';
import { useApiWorker } from '@shared/api';
import { useRemoteMapStore } from '@shared/lib/remoteStore';

export const useMountedDirectories = createGlobalState(() => {
  const api = useApiWorker();

  const store = useRemoteMapStore(api.directories);

  return {
    ...store,
  };
});
