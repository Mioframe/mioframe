import { useDatabaseDocument } from '@entity/database';
import type { CFRDocument, DocumentContent } from '@shared/lib/cfrDocument';
import type { Item, View, ViewId } from '@shared/lib/databaseDocument';
import {
  createDatabaseDocument,
  DATABASE_DOCUMENT_TYPE,
} from '@shared/lib/databaseDocument';
import type { MenuItem } from '@shared/ui/ContextButton';
import { toValue } from '@vueuse/core';
import { cloneDeep, get } from 'lodash-es';
import type { Ref } from 'vue';
import { computed, ref } from 'vue';

export enum ViewAction {
  delete,
}

export const setupDatabaseDocument = (
  cfrDocument: Ref<CFRDocument | undefined>,
  doc: Ref<DocumentContent | undefined>,
) => {
  const databaseDocument = computed(() =>
    cfrDocument.value && doc.value?.type === DATABASE_DOCUMENT_TYPE
      ? createDatabaseDocument(cfrDocument.value)
      : undefined,
  );

  const { properties: databaseProperties, views: databaseViews } =
    useDatabaseDocument(databaseDocument);

  const isShowPropertyCreate = ref(false);

  const hasAddProperty = computed(() => !!databaseDocument.value);

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
    databaseDocument.value?.addItem(cloneDeep(stateNewItem.value));
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
    databaseDocument.value?.addView(view);
    isShowViewAdd.value = false;
  };

  const selectedViewId = ref<ViewId>();

  const selectedView = computed(
    (): {
      name: string;
    } => {
      const id = selectedViewId.value;
      const views = databaseViews.value;

      if (id && id in views) {
        return views[id];
      }

      const firstView = Object.values(databaseViews.value).at(0);

      if (firstView) {
        return firstView;
      }

      return {
        name: 'default',
      };
    },
  );

  const removeViewId = ref<ViewId>();

  const removeView = computed(
    () => removeViewId.value && get(databaseViews.value, removeViewId.value),
  );

  const onRemoveDatabaseView = () =>
    removeViewId.value &&
    toValue(databaseDocument)?.removeView(removeViewId.value);

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

  return {
    databaseProperties,
    databaseViews,

    isShowPropertyCreate,
    hasAddProperty,
    hasRemoveProperty,
    isShowPropertyRemove,
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
