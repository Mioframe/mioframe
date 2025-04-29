import type { PartialDeep } from 'type-fest';
import type {
  UseDatabaseDocument,
  DataBaseStateLatest,
  DatabaseDocumentWithContent,
} from '../types';
import {
  zodDatabaseDocumentWithContent,
  zodDatabaseTypeDocument,
} from '../types';
import { isNil } from 'lodash-es';
import { computed } from 'vue';
import { pickDictionaryBy } from '../../pickDictionaryBy';
import type { MaybeRef } from '@vueuse/core';
import {
  addPropertyMutation,
  removePropertyMutation,
  updatePropertyMutation,
} from './propertyMutations';
import type { DocHandle } from '@automerge/automerge-repo';
import { useCFRDocument } from '../../cfrDocument/useCFRDocument';
import type { ReadonlyMapDeep } from 'type-fest/source/readonly-deep';
import { is } from '../../validateZodScheme';
import { applyDatabaseDocumentMigration } from '../migrations';
import { putObject } from '../../changeObject';
import { createLogger } from '../../logger';
import {
  addSortDescriptionMutation,
  addViewMutation,
  removeViewMutation,
  renameViewMutation,
  toggleSortDirectionMutation,
} from './viewMutations';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseSortDescription,
  DatabaseUnknownProperty,
  DatabaseView,
  DatabaseViewId,
} from '../state';
import {
  addItemMutation,
  removeItemMutation,
  updateItemMutation,
} from './itemMutations';

const { debug, watchDebug } = createLogger('useDatabaseDocument');

export const useDatabaseDocument = (
  docHandleRef: MaybeRef<DocHandle<unknown> | undefined>,
): UseDatabaseDocument => {
  debug('setup');

  const { change, content: unknownTypeContent } = useCFRDocument(docHandleRef);

  watchDebug('unknownTypeContent', unknownTypeContent);

  const updateDatabaseDocument = <R>(
    update: (doc: DataBaseStateLatest) => R,
  ): Promise<R> =>
    new Promise((resolve, reject) => {
      change((doc) => {
        if (!is(doc, zodDatabaseTypeDocument)) {
          reject(new Error('document is not DatabaseTypeDocument'));
          return;
        }

        const databaseBody: DataBaseStateLatest =
          applyDatabaseDocumentMigration(doc);

        const result = update(databaseBody);

        resolve(result);
      });
    });

  const parseDocumentContent = computed(() =>
    zodDatabaseDocumentWithContent.safeParse(unknownTypeContent.value),
  );

  // TODO: добавить возможность принудительного запуска миграций в случае ошибок
  const documentError = computed(() => parseDocumentContent.value.error);

  const content = computed(
    (): DatabaseDocumentWithContent | undefined =>
      parseDocumentContent.value.data,
  );

  const body = computed(() => content.value?.body);

  const properties = computed(() => body.value?.properties);

  const views = computed((): ReadonlyMapDeep<DatabaseViewId, DatabaseView> => {
    const views = body.value?.views;

    const entries: [DatabaseViewId, DatabaseView][] | undefined = views
      ? <[DatabaseViewId, DatabaseView][]>Object.entries(views)
      : undefined;

    return new Map<DatabaseViewId, DatabaseView>(entries);
  });

  const data = computed(() =>
    body.value
      ? pickDictionaryBy(body.value.data, (v) => !isNil(v))
      : undefined,
  );

  const addProperty = async (
    column: DatabaseUnknownProperty,
  ): Promise<DatabasePropertyId> =>
    await updateDatabaseDocument((body) => {
      return addPropertyMutation(body.properties, column);
    });

  const updateProperty = async (
    propertyId: DatabasePropertyId,
    propertyDescription: PartialDeep<DatabaseUnknownProperty>,
  ) =>
    updateDatabaseDocument((body) => {
      updatePropertyMutation(body.properties, propertyId, propertyDescription);
    });

  const removeProperty = async (propertyId: DatabasePropertyId) => {
    await updateDatabaseDocument((body) => {
      removePropertyMutation(body.properties, propertyId);
    });
  };

  const addItem = async (item: DatabaseItem) =>
    await updateDatabaseDocument((body) => {
      return addItemMutation(body.data, item);
    });

  const updateItem = async (
    itemId: DatabaseItemId,
    partialItem: PartialDeep<DatabaseItem>,
  ) => {
    await updateDatabaseDocument((body) => {
      updateItemMutation(body.data, itemId, partialItem);
    });
  };

  const removeItem = async (itemId: DatabaseItemId) =>
    updateDatabaseDocument((body) => {
      removeItemMutation(body.data, itemId);
    });

  const addView = async (view: DatabaseView) =>
    await updateDatabaseDocument((body) => {
      return addViewMutation(body, view);
    });

  const removeView = async (viewId: DatabaseViewId) => {
    await updateDatabaseDocument((body) => {
      removeViewMutation(body, viewId);
    });
  };

  const addSortDescription = async (
    viewId: DatabaseViewId,
    sortDescription: DatabaseSortDescription,
  ) => {
    await updateDatabaseDocument((body) => {
      addSortDescriptionMutation(body, viewId, sortDescription);
    });
  };

  const toggleSortDirection = async (
    viewId: DatabaseViewId,
    propertyId: DatabasePropertyId,
  ) => {
    await updateDatabaseDocument((body) => {
      toggleSortDirectionMutation(body, viewId, propertyId);
    });
  };

  const renameView = async (viewId: DatabaseViewId, newName: string) => {
    await updateDatabaseDocument((body) => {
      renameViewMutation(body, viewId, newName);
    });
  };

  const updateView = async (
    viewId: DatabaseViewId,
    view: PartialDeep<DatabaseView>,
  ) =>
    updateDatabaseDocument((body) => {
      putObject(body, {
        [viewId]: view,
      });
    });

  const databaseDocument = {
    content,
    properties,
    views,
    data,

    addProperty,
    updateProperty,
    removeProperty,

    addItem,
    updateItem,
    removeItem,

    addView,
    removeView,
    renameView,
    addSortDescription,
    toggleSortDirection,
    updateView,

    documentError,
  };

  return databaseDocument;
};
