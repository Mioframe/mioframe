import type { ReactiveCFRDocument } from '@entity/document/createReactiveCFRDocument';
import type { UnknownProperty } from '@shared/lib/databaseDocument';
import {
  DATABASE_DOCUMENT_TYPE,
  type Item,
  type PropertyId,
  type View,
  type ViewId,
} from '@shared/lib/databaseDocument';
import { useDatabaseDocument } from '@shared/lib/databaseDocument/useDatabaseDocument';
import type { MenuItem } from '@shared/ui/ContextButton';
import type { MaybeRef } from '@vueuse/core';
import { first } from 'ix/iterable/first';
import { cloneDeep, get } from 'lodash-es';
import { computed, ref } from 'vue';

export enum ViewAction {
  delete,
}

export const setupDatabaseDocument = (
  reactiveCFRDocument: MaybeRef<ReactiveCFRDocument | undefined>,
) => {
  const {
    properties: databaseProperties,
    views: databaseViews,
    content,
    addItem,
    addView,
    removeView: removeViewFromDB,
    removeProperty,
    addProperty,
  } = useDatabaseDocument(reactiveCFRDocument);

  const isShowPropertyCreate = ref(false);

  const onCreateProperty = (property: UnknownProperty) => {
    addProperty(property);
    isShowPropertyCreate.value = false;
  };

  const isDatabaseType = computed(
    () => content.value?.type === DATABASE_DOCUMENT_TYPE,
  );

  const hasRemoveProperty = computed(
    () =>
      databaseProperties.value && Object.keys(databaseProperties.value).length,
  );

  const isShowPropertyRemove = ref(false);

  const isShowItemAdd = ref(false);

  const hasItemAdd = computed(
    () =>
      databaseProperties.value && Object.keys(databaseProperties.value).length,
  );

  const stateNewItem = ref<Item>({});

  const onAddItem = () => {
    addItem(cloneDeep(stateNewItem.value));
    stateNewItem.value = {};
    isShowItemAdd.value = false;
  };

  const onCancelAddItem = () => {
    isShowItemAdd.value = false;
    stateNewItem.value = {};
  };

  const isShowViewList = ref(false);

  const isShowViewAdd = ref(false);

  const onSubmitViewAdd = (view: View) => {
    addView(view);
    isShowViewAdd.value = false;
  };

  const selectedViewId = ref<ViewId>();

  const selectedView = computed((): View | undefined => {
    const id = selectedViewId.value;
    const views = databaseViews.value;

    if (views) {
      if (id && id in views) {
        return views[id];
      }

      const [, firstView] = first(views) ?? [];

      if (firstView) {
        return firstView;
      }
    }

    return undefined;
  });

  const removeViewId = ref<ViewId>();

  const removeView = computed(
    () => removeViewId.value && get(databaseViews.value, removeViewId.value),
  );

  const onRemoveDatabaseView = () => {
    if (removeViewId.value) {
      removeViewFromDB(removeViewId.value);
    }
  };

  const onCancelRemoveDatabaseView = () => {
    removeViewId.value = undefined;
  };

  const contextViewMenu: MenuItem<ViewAction>[] = [
    {
      eventName: ViewAction.delete,
      label: 'delete',
    },
  ];

  const onClickViewContextBtn = (action: ViewAction, viewId: ViewId) => {
    switch (action) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- will be supplemented
      case ViewAction.delete: {
        removeViewId.value = viewId;
        break;
      }
    }
  };

  const onRemoveProperty = (propertyId: PropertyId) => {
    removeProperty(propertyId);
    isShowPropertyRemove.value = false;
  };

  return {
    databaseProperties,
    databaseViews,

    isShowPropertyCreate,
    onCreateProperty,

    isDatabaseType,

    hasRemoveProperty,
    isShowPropertyRemove,
    onRemoveProperty,

    isShowItemAdd,
    hasItemAdd,
    onAddItem,
    onCancelAddItem,

    stateNewItem,
    isShowViewList,
    isShowViewAdd,
    onSubmitViewAdd,
    selectedViewId,
    selectedView,

    removeView,
    onRemoveDatabaseView,
    contextViewMenu,
    onClickViewContextBtn,
    onCancelRemoveDatabaseView,
  };
};
