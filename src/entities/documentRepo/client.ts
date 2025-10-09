import { useMainService } from '@shared/api';
import { useSubscribeByQueryClient } from '@shared/lib/subscriptions/subscribeClient';
import { createGlobalState } from '@vueuse/core';

export const useDocumentRepoClient = createGlobalState(() => {
  const {
    repositoriesStore: {
      createDocument,
      removeDocument,
      subscribeDocumentIdList,
    },
  } = useMainService();

  const getDocumentIdList = useSubscribeByQueryClient(subscribeDocumentIdList);

  return {
    getDocumentIdList,

    removeDocument,
    createDocument,
  };
});
