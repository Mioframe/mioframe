<script setup lang="ts">
import { DbItemAddDialog } from '@feature/databaseItemEdit';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownProperty,
  DatabaseValue,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import {
  useDatabaseData,
  useDatabaseDocument,
  useDatabaseViewsMap,
} from '@shared/lib/databaseDocument';
import { computed, ref, shallowRef, toRefs, watchEffect } from 'vue';
import { MDBottomSheet } from '@shared/ui/Sheets';
import { defineBarButtons, MDButtonsBar } from '@shared/ui/ButtonsBar';
import { DatabasePropertyList } from '@entity/databaseProperty';
import {
  defineMenuButtonList,
  MDContextMenuBtn,
  MDContextMenuButton,
} from '@shared/ui/Menu';
import { DatabasePropertyRemoveDialog } from '@feature/databasePropertyRemove';
import { DatabasePropertyRenameDialog } from '@feature/databasePropertyRename';
import DatabaseViewPresetSettingsWidget from './DatabaseViewPresetSettingsWidget.vue';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';
import EditableInlineValue from './EditableInlineValue.vue';
import { useSnackbar } from '@shared/ui/Snackbar';
import { useDatabaseItemRemove } from '@feature/databaseItemRemove';
import { DatabasePropertyCreationDialog } from '@feature/databasePropertyCreate';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import ValueField from './ValueField.vue';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument/useDatabasePropertiesMap';

const props = defineProps<{
  docHandle: AMDocHandle;
  directory: DirectoryFSEntry;
}>();

const { directory, docHandle } = toRefs(props);

const databaseDocument = useDatabaseDocument(docHandle);

const { state, documentError } = toRefs(databaseDocument);

const { createItem, setValue } = useDatabaseData(docHandle);

const properties = computed(() => state.value?.properties);

const propertiesMap = useDatabasePropertiesMap(docHandle);

const isShowAddProperty = ref(false);

const onCreateProperty = async (property: DatabaseUnknownProperty) => {
  await propertiesMap.create(property);
  isShowAddProperty.value = false;
};

const isShowAddItem = ref(false);

const onAddItem = async (item: DatabaseItem) => {
  await createItem(item);
  isShowAddItem.value = false;
};

enum Action {
  addItem,
  addProperty,
}

const firstLineButtonsDescription = defineBarButtons([
  {
    label: 'Add item',
    iconName: 'add',
    action: Action.addItem,
  },
  {
    label: 'Add property',
    iconName: 'contextual_token_add',
    action: Action.addProperty,
  },
]);

const onClickButtonsBar = (
  item: (typeof firstLineButtonsDescription)[number],
) => {
  switch (item.action) {
    case Action.addItem: {
      isShowAddItem.value = true;
      break;
    }
    case Action.addProperty: {
      isShowAddProperty.value = true;
      break;
    }
    default:
      throw new Error('unknown action');
  }
};

enum PropertyAction {
  remove,
  rename,
}

const propertyContextBtns = defineMenuButtonList([
  [
    PropertyAction.rename,
    {
      text: 'Rename',
      symbolName: 'edit',
    },
  ],
  [
    PropertyAction.remove,
    {
      text: 'Remove',
      symbolName: 'delete',
    },
  ],
]);

const removePropertyId = ref<DatabasePropertyId>();

const onApplyRemoveProperty = async (propertyId: DatabasePropertyId) => {
  await propertiesMap.remove(propertyId);
  removePropertyId.value = undefined;
};

const renamePropertyId = ref<DatabasePropertyId>();

const renamePropertyName = computed(() =>
  renamePropertyId.value
    ? propertiesMap.get(renamePropertyId.value)?.name
    : undefined,
);

const onApplyRenameProperty = async (
  propertyId: DatabasePropertyId,
  name: string,
) => {
  await propertiesMap.update(propertyId, {
    name,
  });
  renamePropertyId.value = undefined;
};

const onClickPropertyContextAction = (
  action: PropertyAction,
  propertyId: DatabasePropertyId,
) => {
  switch (action) {
    case PropertyAction.remove: {
      removePropertyId.value = propertyId;
      break;
    }
    case PropertyAction.rename: {
      renamePropertyId.value = propertyId;
      break;
    }

    default:
      throw new Error('unknown property action');
  }
};

const onChangeValue = async (
  itemId: DatabaseItemId,
  propertyId: DatabasePropertyId,
  value: DatabaseValue,
) => {
  await setValue(itemId, propertyId, value);
};

const selectedViewId = shallowRef<DatabaseViewId>();

const databaseViewMap = useDatabaseViewsMap(docHandle);

watchEffect(() => {
  if (!selectedViewId.value) {
    selectedViewId.value = databaseViewMap.list?.at(0)?.[0];
  }
});

const filteredFirstLineButtons = computed(() =>
  firstLineButtonsDescription.filter((btn) => {
    if (btn.action === Action.addItem) {
      return !!propertiesMap.size;
    }

    return true;
  }),
);

enum ITEM_CONTEXT_ACTION {
  remove,
}

const itemContextualButtons = defineMenuButtonList([
  [ITEM_CONTEXT_ACTION.remove, { symbolName: 'delete', text: 'remove' }],
]);

const { addSnackbar } = useSnackbar();

const { remove: removeItem } = useDatabaseItemRemove(docHandle);

const onClickItemContextBtn = async (
  action: ITEM_CONTEXT_ACTION,
  itemId: DatabaseItemId,
) => {
  switch (action) {
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- for other actions
    case ITEM_CONTEXT_ACTION.remove:
      await removeItem(itemId);
      break;

    default:
      addSnackbar({
        text: 'work in progress',
      });
      break;
  }
};
</script>

<template>
  <div class="database-view">
    <div v-if="documentError" class="database-view__error">
      <pre>{{ documentError }}</pre>
    </div>

    <DatabaseViewLayout :doc-handle="docHandle" :view-id="selectedViewId">
      <template #value="{ item, itemId, property, propertyId }">
        <EditableInlineValue
          :item="item"
          :property-id="propertyId"
          :property="property"
          :directory="directory"
          :doc-handle="docHandle"
          @update:value="onChangeValue(itemId, propertyId, $event)"
        />
      </template>

      <template #action="{ itemId }">
        <MDContextMenuBtn
          :btns="itemContextualButtons"
          @click="onClickItemContextBtn($event, itemId)"
        />
      </template>
    </DatabaseViewLayout>

    <div class="database-view__controls">
      <MDBottomSheet class="database-view__sheet sheet">
        <template #head>
          <MDButtonsBar
            :buttons="filteredFirstLineButtons"
            @click="onClickButtonsBar"
          />
        </template>

        <div class="sheet__body">
          <DatabaseViewPresetSettingsWidget
            v-model:selected-view-id="selectedViewId"
            :doc-handle="docHandle"
          />

          <DatabasePropertyList
            v-if="properties"
            :properties="properties"
            class="sheet__property-list"
          >
            <template #trailingIcon="{ propertyId }">
              <MDContextMenuButton
                :btns="propertyContextBtns"
                @click="onClickPropertyContextAction($event, propertyId)"
              />
            </template>
          </DatabasePropertyList>
        </div>
      </MDBottomSheet>
    </div>

    <DatabasePropertyCreationDialog
      v-if="isShowAddProperty"
      :directory="directory"
      @create="onCreateProperty"
      @cancel="isShowAddProperty = false"
    />

    <DbItemAddDialog
      v-if="isShowAddItem && properties"
      :properties="properties"
      @add="onAddItem"
      @cancel="isShowAddItem = false"
    >
      <template #valueField="{ property, update, value, propertyId }">
        <ValueField
          :property="property"
          :value="value"
          :directory="directory"
          :property-id="propertyId"
          :doc-handle="docHandle"
          @update:value="update"
        />
      </template>
    </DbItemAddDialog>

    <DatabasePropertyRemoveDialog
      v-if="removePropertyId"
      @apply="onApplyRemoveProperty(removePropertyId)"
      @cancel="removePropertyId = undefined"
    />

    <DatabasePropertyRenameDialog
      v-if="renamePropertyId"
      :name="renamePropertyName"
      @apply="onApplyRenameProperty(renamePropertyId, $event)"
      @cancel="renamePropertyId = undefined"
    />
  </div>
</template>

<style lang="css" scoped>
.database-view {
  display: flex;
  flex-direction: column;
  flex: 1 0;

  &__controls {
    margin-top: auto;
    flex-shrink: 0;
    position: sticky;
    bottom: 0;
    background: transparent;
  }

  &__table {
    flex-shrink: 0;
    flex-grow: 1;
    padding: 16px;
  }
}

.sheet {
  &__head {
    display: flex;
  }

  &__body {
    padding: 16px;
  }

  &__property-list {
    --md-list-container-border-radius: 16px;
  }
}
</style>
