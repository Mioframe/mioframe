import { useApiClient } from '@shared/api';
import { useSubscribeByQueryClient } from '@shared/lib/remoteStore/subscribeClient';
import { createGlobalState } from '@vueuse/core';

export const useDocumentRepoClient = createGlobalState(() => {
  const api = useApiClient();

  const documentIdList = useSubscribeByQueryClient(
    api.repositoriesStore.subscribeDocumentIdList,
  );

  const removeDocument = async (
    ...args: Parameters<typeof api.repositoriesStore.removeDocument>
  ) => {
    await api.repositoriesStore.removeDocument(...args);
  };

  const createDocument = async (
    ...args: Parameters<typeof api.repositoriesStore.createDocument>
  ) => {
    await api.repositoriesStore.createDocument(...args);
  };

  return {
    documentIdList,

    removeDocument,
    createDocument,
  };
});
