<script setup lang="ts">
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseValue,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import {
  useDatabaseData,
  useDatabaseDocument,
  useDatabaseViewsMap,
} from '@shared/lib/databaseDocument';
import { shallowRef, toRefs, watchEffect } from 'vue';
import { defineMenuButtonList, MDContextMenuBtn } from '@shared/ui/Menu';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';
import EditableInlineValue from './EditableInlineValue.vue';
import { useSnackbar } from '@shared/ui/Snackbar';
import { useDatabaseItemRemove } from '@feature/databaseItemRemove';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import DatabaseToolbar from './DatabaseToolbar.vue';

const props = defineProps<{
  docHandle: AMDocHandle;
  directory: DirectoryFSEntry;
}>();

const { directory, docHandle } = toRefs(props);

const databaseDocument = useDatabaseDocument(docHandle);

const { documentError } = toRefs(databaseDocument);

const { setValue } = useDatabaseData(docHandle);

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

enum ITEM_CONTEXT_ACTION {
  remove,
}

const itemContextualButtons = defineMenuButtonList([
  { symbolName: 'delete', label: 'remove', key: ITEM_CONTEXT_ACTION.remove },
]);

const { addSnackbar } = useSnackbar();

const { remove: removeItem } = useDatabaseItemRemove(docHandle);

const onClickItemContextBtn = async (
  { key: action }: { key: ITEM_CONTEXT_ACTION },
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

    <DatabaseViewLayout
      :doc-handle="docHandle"
      :view-id="selectedViewId"
      :directory="directory"
      class="database-view__layout"
    >
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

    <DatabaseToolbar
      v-model:selected-view-id="selectedViewId"
      :doc-handle="docHandle"
      :directory="directory"
    />
  </div>
</template>

<style lang="css" scoped>
.database-view {
  display: flex;
  flex-direction: column;
  flex: 1 0;
  overflow-y: auto;

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

  &__layout {
    overflow: visible;
  }

  &__fab-container {
    bottom: 7step;
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
