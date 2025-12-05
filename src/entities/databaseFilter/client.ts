import { useMainServiceClient } from '@shared/service/useService';
import { useSubscribeByQueryClient } from '@shared/lib/subscriptions';
import { createGlobalState } from '@vueuse/core';

export const useDatabaseViewFilterClient = createGlobalState(() => {
  const {
    databaseDocument: {
      views: {
        filter: { subscribeGet, patch, post },
      },
    },
  } = useMainServiceClient();

  return {
    get: useSubscribeByQueryClient(subscribeGet),
    patch,
    post,
  };
});
