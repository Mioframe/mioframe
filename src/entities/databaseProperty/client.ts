import { useMainService } from '@shared/api';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { PatchSource } from '@shared/lib/changeObject';
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { useSubscribeByQueryClient } from '@shared/lib/subscriptions';
import { createGlobalState } from '@vueuse/core';

export const useDatabasePropertiesClient = createGlobalState(() => {
  const {
    databaseDocument: {
      properties: {
        patch,
        post,
        subscribeDatabaseProperties,
        subscribeDatabasePropertiesIdList,
        subscribeGet,
        subscribeSize,
        remove,
      },
    },
  } = useMainService();

  return {
    getDatabaseProperties: useSubscribeByQueryClient(
      subscribeDatabaseProperties,
    ),
    databasePropertiesIdList: useSubscribeByQueryClient(
      subscribeDatabasePropertiesIdList,
    ),
    getProperty: useSubscribeByQueryClient(subscribeGet),
    getPropertySize: useSubscribeByQueryClient(subscribeSize),

    patch: <T extends DatabaseUnknownProperty>(
      path: string[],
      documentId: AMDocumentId,
      id: DatabasePropertyId,
      property: PatchSource<T>,
    ) => patch(path, documentId, id, property),
    post,
    remove,
  };
});
