import { useMainService } from '@shared/api';
import { useSubscribeByQueryClient } from '@shared/lib/subscriptions';
import { createGlobalState } from '@vueuse/core';

export const useCFRDocumentClient = createGlobalState(() => {
  const {
    cfrDocument: { put, patch, subscribeDocumentDescription },
  } = useMainService();

  return {
    getDocumentDescription: useSubscribeByQueryClient(
      subscribeDocumentDescription,
    ),

    put,
    patch,
  };
});
