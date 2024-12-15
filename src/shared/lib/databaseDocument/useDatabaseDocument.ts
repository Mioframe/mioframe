import type { PartialDeep } from 'type-fest';
import type { Item, ItemId } from './item';
import { type UnknownProperty, type PropertyId } from './property';
import { type DatabaseDocument, zodDatabaseDocumentWithContent } from './types';
import { isNil } from 'lodash-es';
import type { SortDescription, View, ViewId } from './view';
import type { ReactiveCFRDocument } from '@entity/document/createReactiveCFRDocument';
import { computed, toValue } from 'vue';
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
  toggleSortDirectionMutation,
} from './view/mutations';

export const useDatabaseDocument = (
  reactiveCFRDocument: MaybeRef<ReactiveCFRDocument | undefined>,
): DatabaseDocument => {
  const content = computed(
    () =>
      zodDatabaseDocumentWithContent.safeParse(
        toValue(reactiveCFRDocument)?.doc,
      ).data,
  );

  const properties = computed(() =>
    content.value?.body?.properties
      ? pickDictionaryBy(content.value.body.properties, (v) => !isNil(v))
      : undefined,
  );

  const views = computed(
    (): ViewsMap | undefined => content.value?.body?.views,
  );

  const data = computed(() => content.value?.body?.data);

  const getDocumentValue = () => {
    const doc = toValue(reactiveCFRDocument);

    if (!doc) {
      throw new Error('document missing');
    }

    return doc;
  };

  const addProperty = async (column: UnknownProperty): Promise<PropertyId> => {
    return await addPropertyMutation(getDocumentValue().change, column);
  };

  const updateProperty = async (
    columnId: PropertyId,
    column: PartialDeep<UnknownProperty>,
  ) => {
    await updatePropertyMutation(getDocumentValue().change, columnId, column);
  };

  const removeProperty = async (propertyId: PropertyId) => {
    await removePropertyMutation(getDocumentValue().change, propertyId);
  };

  const addItem = async (item: Item) => {
    return await addItemMutation(getDocumentValue().change, item);
  };

  const updateItem = async (itemId: ItemId, partialItem: PartialDeep<Item>) => {
    await updateItemMutation(getDocumentValue().change, itemId, partialItem);
  };

  const removeItem = async (itemId: ItemId) => {
    await removeItemMutation(getDocumentValue().change, itemId);
  };

  const addView = async (view: View) => {
    return await addViewMutation(getDocumentValue().change, view);
  };

  const removeView = async (viewId: ViewId) => {
    await removeViewMutation(getDocumentValue().change, viewId);
  };

  const addSortDescription = async (
    viewId: ViewId,
    sortDescription: SortDescription,
  ) => {
    await addSortDescriptionMutation(
      getDocumentValue().change,
      viewId,
      sortDescription,
    );
  };

  const toggleSortDirection = async (
    viewId: ViewId,
    propertyId: PropertyId,
  ) => {
    await toggleSortDirectionMutation(
      getDocumentValue().change,
      viewId,
      propertyId,
    );
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
    addSortDescription,
    toggleSortDirection,
  };

  return databaseDocument;
};
