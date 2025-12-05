import { useMainService } from '@shared/service';
import { useSubscribeByQueryClient } from '@shared/lib/subscriptions';
import { createGlobalState } from '@vueuse/core';

export const useDatabaseDataClient = createGlobalState(() => {
  const {
    databaseDocument: {
      data: {
        postValue,
        removeItem,
        subscribeItem,
        subscribeItemIdList,
        subscribeValue,
        postItem,
      },
    },
  } = useMainService();

  return {
    postValue,
    postItem,
    removeItem,
    getItemIdList: useSubscribeByQueryClient(subscribeItemIdList),
    getItem: useSubscribeByQueryClient(subscribeItem),
    getValue: useSubscribeByQueryClient(subscribeValue),
  };
});
