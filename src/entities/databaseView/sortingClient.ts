import { useMainService } from '@shared/service';
import { useSubscribeByQueryClient } from '@shared/lib/subscriptions';

export const useDatabaseViewSortingClient = () => {
  const {
    databaseDocument: {
      views: {
        sorting: {
          subscribeSortingEntries,
          subscribeSortingPropertiesIdList,
          changePriority,
          post,
          patch,
          remove,
        },
      },
    },
  } = useMainService();

  return {
    sortingEntries: useSubscribeByQueryClient(subscribeSortingEntries),
    sortingPropertiesIdList: useSubscribeByQueryClient(
      subscribeSortingPropertiesIdList,
    ),

    changePriority,
    post,
    patch,
    remove,
  };
};
