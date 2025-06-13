<script setup lang="ts">
import { DbItemAddDialog } from '@feature/databaseItemEdit';
import DatabasePropertyCreationDialog from '@feature/databasePropertyCreate/DatabasePropertyCreationDialog.vue';
import { useDatabaseDocument } from '@shared/lib/databaseDocument';
import { computed, ref, shallowRef, toRef } from 'vue';
import { MDBottomSheet } from '@shared/ui/Sheets';
import { defineBarButtons, MDButtonsBar } from '@shared/ui/ButtonsBar';
import { DatabasePropertyList } from '@entity/databaseProperty';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { DatabasePropertyRemoveDialog } from '@feature/databasePropertyRemove';
import { DatabasePropertyRenameDialog } from '@feature/databasePropertyRename';
import { EmptySymbol } from '@shared/ui/EmptySymbol';
import DatabaseViewTable from './DatabaseViewTable.vue';
import DatabaseViewPresetSettingsWidget from './DatabaseViewPresetSettingsWidget.vue';
import type { DatabaseViewId } from '@shared/lib/databaseDocument/state/v2';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownProperty,
  DatabaseValue,
} from '@shared/lib/databaseDocument/state';
import type { DocHandle } from '@shared/lib/cfrDocument/automergeTypes';

const { docHandle } = defineProps<{
  docHandle: DocHandle;
}>();

const docHandleRef = toRef(() => docHandle);

const {
  addItem,
  addProperty,
  data,
  properties,
  removeProperty,
  updateProperty,
  updateItem,
  documentError,
} = useDatabaseDocument(docHandleRef);

const isShowAddProperty = ref(false);

const onCreateProperty = async (property: DatabaseUnknownProperty) => {
  await addProperty(property);
  isShowAddProperty.value = false;
};

const isShowAddItem = ref(false);

const onAddItem = async (item: DatabaseItem) => {
  await addItem(item);
  isShowAddItem.value = false;
};

enum Action {
  addItem,
  addProperty,
}

const firstLineButtons = defineBarButtons([
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

const onClickButtonsBar = (item: (typeof firstLineButtons)[number]) => {
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
  await removeProperty(propertyId);
  removePropertyId.value = undefined;
};

const renamePropertyId = ref<DatabasePropertyId>();

const renamePropertyName = computed(() =>
  renamePropertyId.value && properties.value
    ? properties.value[renamePropertyId.value].name
    : undefined,
);

const onApplyRenameProperty = async (
  propertyId: DatabasePropertyId,
  name: string,
) => {
  await updateProperty(propertyId, {
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
  await updateItem(itemId, {
    [propertyId]: value,
  });
};

const selectedViewId = shallowRef<DatabaseViewId>();
</script>

<template>
  <div class="database-view">
    <div v-if="documentError" class="database-view__error">
      <pre>{{ documentError }}</pre>
    </div>

    <DatabaseViewTable
      v-else-if="properties && data"
      class="database-view__table"
      :properties
      :data
      @change-value="onChangeValue"
    />

    <EmptySymbol v-else class="database-view__empty" />

    <div class="database-view__controls">
      <MDBottomSheet class="database-view__sheet sheet">
        <template #head>
          <MDButtonsBar
            :buttons="firstLineButtons"
            @click="onClickButtonsBar"
          />
        </template>

        <div class="sheet__body">
          <DatabaseViewPresetSettingsWidget
            v-model:selected-view-id="selectedViewId"
            :doc-handle
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
      @create="onCreateProperty"
      @cancel="isShowAddProperty = false"
    />

    <DbItemAddDialog
      v-if="isShowAddItem && properties"
      :properties
      @add="onAddItem"
      @cancel="isShowAddItem = false"
    />

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
