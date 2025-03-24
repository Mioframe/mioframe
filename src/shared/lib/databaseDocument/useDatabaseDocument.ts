import type { PartialDeep } from 'type-fest';
import type { Item, ItemId } from './item';
import { type UnknownProperty, type PropertyId } from './property';
import { type DatabaseDocument, zodDatabaseDocumentWithContent } from './types';
import { isNil } from 'lodash-es';
import type { SortDescription, View, ViewId } from './view';
import { computed } from 'vue';
import { pickDictionaryBy } from '../pickDictionaryBy';
import type { MaybeRef } from '@vueuse/core';
import type { ViewsMap } from './versions';
import {
  addPropertyMutation,
  removePropertyMutation,
  updatePropertyMutation,
} from './property/mutations';
import {
  addItemMutation,
  removeItemMutation,
  updateItemMutation,
} from './item/mutations';
import {
  addSortDescriptionMutation,
  addViewMutation,
  removeViewMutation,
  renameViewMutation,
  toggleSortDirectionMutation,
} from './view/mutations';
import type { DocHandle } from '@automerge/automerge-repo';
import { useCFRDocument } from '../cfrDocument/useCFRDocument';

export const useDatabaseDocument = (
  docHandleRef: MaybeRef<DocHandle<unknown> | undefined>,
): DatabaseDocument => {
  const { change, content: unknownTypeContent } = useCFRDocument(docHandleRef);

  const content = computed(
    () =>
      zodDatabaseDocumentWithContent.safeParse(unknownTypeContent.value).data,
  );

  const properties = computed(() =>
    content.value?.body
      ? pickDictionaryBy(content.value.body.properties, (v) => !isNil(v))
      : undefined,
  );

  const views = computed(
    (): ViewsMap | undefined => content.value?.body?.views,
  );

  const data = computed(() =>
    content.value?.body
      ? pickDictionaryBy(content.value.body.data, (v) => !isNil(v))
      : undefined,
  );

  const addProperty = async (column: UnknownProperty): Promise<PropertyId> => {
    return await addPropertyMutation(change, column);
  };

  const updateProperty = async (
    columnId: PropertyId,
    column: PartialDeep<UnknownProperty>,
  ) => {
    await updatePropertyMutation(change, columnId, column);
  };

  const removeProperty = async (propertyId: PropertyId) => {
    await removePropertyMutation(change, propertyId);
  };

  const addItem = async (item: Item) => {
    return await addItemMutation(change, item);
  };

  const updateItem = async (itemId: ItemId, partialItem: PartialDeep<Item>) => {
    await updateItemMutation(change, itemId, partialItem);
  };

  const removeItem = async (itemId: ItemId) => {
    await removeItemMutation(change, itemId);
  };

  const addView = async (view: View) => {
    return await addViewMutation(change, view);
  };

  const removeView = async (viewId: ViewId) => {
    await removeViewMutation(change, viewId);
  };

  const addSortDescription = async (
    viewId: ViewId,
    sortDescription: SortDescription,
  ) => {
    await addSortDescriptionMutation(change, viewId, sortDescription);
  };

  const toggleSortDirection = async (
    viewId: ViewId,
    propertyId: PropertyId,
  ) => {
    await toggleSortDirectionMutation(change, viewId, propertyId);
  };

  const renameView = async (viewId: ViewId, newName: string) => {
    await renameViewMutation(change, viewId, newName);
  };

  const databaseDocument: DatabaseDocument = {
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
  };

  return databaseDocument;
};
