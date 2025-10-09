import { useMainService } from '@shared/api';
import { useSubscribeByQueryClient } from '@shared/lib/subscriptions';

export const useDatabaseDataClient = () => {
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
    itemIdList: useSubscribeByQueryClient(subscribeItemIdList),
    getItem: useSubscribeByQueryClient(subscribeItem),
    getValue: useSubscribeByQueryClient(subscribeValue),
  };
};
