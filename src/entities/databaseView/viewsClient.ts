import { useMainService } from '@shared/service';
import { useSubscribeByQueryClient } from '@shared/lib/subscriptions';
import { createGlobalState } from '@vueuse/core';

export const useDatabaseViewsClient = createGlobalState(() => {
  const {
    databaseDocument: { views: view },
  } = useMainService();

  return {
    views: useSubscribeByQueryClient(view.subscribeDatabaseViews),
    getViewList: useSubscribeByQueryClient(view.subscribeDatabaseViewList),
    view: useSubscribeByQueryClient(view.subscribeDatabaseView),
    firstView: useSubscribeByQueryClient(view.subscribeDatabaseFirstView),
    remove: view.remove,
    changeOrder: view.changeOrder,
    create: view.create,
    patch: view.patch,
  };
});
