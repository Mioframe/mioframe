<script setup lang="ts">
import type { DocHandle } from '@automerge/automerge-repo';
import { DbItemAddDialog } from '@feature/databaseItemAdd';
import DatabasePropertyCreationDialog from '@feature/databasePropertyCreate/DatabasePropertyCreationDialog.vue';
import type {
  Item,
  ItemId,
  PropertyId,
  UnknownProperty,
} from '@shared/lib/databaseDocument';
import { useDatabaseDocument } from '@shared/lib/databaseDocument';
import { computed, ref, toRef } from 'vue';
import { MDBottomSheet } from '@shared/ui/Sheets';
import { defineBarButtons, MDButtonsBar } from '@shared/ui/ButtonsBar';
import { DatabasePropertyList } from '@entity/databaseProperty';
import { defineContextButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import { DatabasePropertyRemoveDialog } from '@feature/databasePropertyRemove';
import { DatabasePropertyRenameDialog } from '@feature/databasePropertyRename';
import { EmptySymbol } from '@shared/ui/EmptySymbol';
import DatabaseViewTable from './DatabaseViewTable.vue';
import type { DatabaseValue } from '@shared/lib/databaseDocument/item/data';

const { docHandle } = defineProps<{
  docHandle: DocHandle<unknown>;
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
} = useDatabaseDocument(docHandleRef);

const isShowAddProperty = ref(false);

const onCreateProperty = async (property: UnknownProperty) => {
  await addProperty(property);
  isShowAddProperty.value = false;
};

const isShowAddItem = ref(false);

const onAddItem = async (item: Item) => {
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

const propertyContextBtns = defineContextButtonList([
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

const removePropertyId = ref<PropertyId>();

const onApplyRemoveProperty = async (propertyId: PropertyId) => {
  await removeProperty(propertyId);
  removePropertyId.value = undefined;
};

const renamePropertyId = ref<PropertyId>();

const renamePropertyName = computed(() =>
  renamePropertyId.value && properties.value
    ? properties.value[renamePropertyId.value].name
    : undefined,
);

const onApplyRenameProperty = async (propertyId: PropertyId, name: string) => {
  await updateProperty(propertyId, {
    name,
  });
  renamePropertyId.value = undefined;
};

const onClickPropertyContextAction = (
  action: PropertyAction,
  propertyId: PropertyId,
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
  itemId: ItemId,
  propertyId: PropertyId,
  value: DatabaseValue,
) => {
  await updateItem(itemId, {
    [propertyId]: value,
  });
};
</script>

<template>
  <div class="database-view">
    <DatabaseViewTable
      v-if="properties && data"
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
  overflow: auto;

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
    /* overflow: auto; */
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
