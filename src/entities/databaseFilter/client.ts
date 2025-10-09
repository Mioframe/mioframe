import { useMainServiceClient } from '@shared/api/useService';
import { useSubscribeByQueryClient } from '@shared/lib/subscriptions';

export const useDatabaseViewFilterClient = () => {
  const {
    databaseDocument: {
      views: {
        filter: { subscribeGet, patch },
      },
    },
  } = useMainServiceClient();

  return {
    get: useSubscribeByQueryClient(subscribeGet),
    patch,
  };
};
