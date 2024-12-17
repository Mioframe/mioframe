import type { ReactiveCFRDocument } from '@entity/document/createReactiveCFRDocument';
import type {
  SortDescription,
  UnknownProperty,
} from '@shared/lib/databaseDocument';
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
  rename,
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
    toggleSortDirection,
    addSortDescription,
    renameView,
  } = useDatabaseDocument(reactiveCFRDocument);

  const isShowPropertyCreate = ref(false);

  const onCreateProperty = async (property: UnknownProperty) => {
    await addProperty(property);
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

  const onAddItem = async () => {
    await addItem(cloneDeep(stateNewItem.value));
    stateNewItem.value = {};
    isShowItemAdd.value = false;
  };

  const onCancelAddItem = () => {
    isShowItemAdd.value = false;
    stateNewItem.value = {};
  };

  const isShowViewList = ref(false);

  const isShowViewAdd = ref(false);

  const onSubmitViewAdd = async (view: View) => {
    await addView(view);
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

  const onRemoveDatabaseView = async () => {
    if (removeViewId.value) {
      await removeViewFromDB(removeViewId.value);
    }
  };

  const onCancelRemoveDatabaseView = () => {
    removeViewId.value = undefined;
  };

  const contextViewMenu: MenuItem<ViewAction>[] = [
    {
      eventName: ViewAction.rename,
      label: 'rename',
    },
    {
      eventName: ViewAction.delete,
      label: 'delete',
    },
  ];

  const renameViewId = ref<ViewId>();

  const onClickViewContextBtn = (action: ViewAction, viewId: ViewId) => {
    switch (action) {
      case ViewAction.delete: {
        removeViewId.value = viewId;
        break;
      }
      case ViewAction.rename: {
        renameViewId.value = viewId;
        break;
      }
      default: {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions -- for untreated actions
        throw new Error(`unhandled context menu action "${action}"`);
      }
    }
  };

  const viewNameBeforeRenaming = computed(() => {
    const viewId = renameViewId.value;
    if (viewId) {
      return databaseViews.value?.[viewId]?.name;
    }
    return undefined;
  });

  const onRenameView = async (newName: string) => {
    if (renameViewId.value) {
      await renameView(renameViewId.value, newName);
      renameViewId.value = undefined;
    }
  };

  const onRemoveProperty = async (propertyId: PropertyId) => {
    await removeProperty(propertyId);
    isShowPropertyRemove.value = false;
  };

  const isShowViewSettings = ref(false);

  const onAddSortDescription = async (sortDescription: SortDescription) => {
    const viewId = selectedViewId.value;
    if (viewId) {
      await addSortDescription(viewId, sortDescription);
    }
  };

  const onToggleSortDirection = async (propertyId: PropertyId) => {
    const viewId = selectedViewId.value;
    if (viewId) {
      await toggleSortDirection(viewId, propertyId);
    }
  };

  const onSelectView = (viewId: ViewId) => {
    selectedViewId.value = viewId;
    isShowViewList.value = false;
  };

  const onClickShowSettings = () => {
    isShowViewSettings.value = !!selectedViewId.value;
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

    viewNameBeforeRenaming,
    onRenameView,

    selectedViewId,
    selectedView,
    onSelectView,

    removeView,
    onRemoveDatabaseView,
    contextViewMenu,
    onClickViewContextBtn,
    onCancelRemoveDatabaseView,

    isShowViewSettings,
    onClickShowSettings,
    onAddSortDescription,
    onToggleSortDirection,
  };
};
