<script setup lang="ts">
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownProperty,
  DatabaseValue,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import {
  useDatabaseData,
  useDatabaseDocument,
  useDatabasePropertiesMap,
  useDatabaseViewsMap,
} from '@shared/lib/databaseDocument';
import { computed, shallowRef, toRefs, useTemplateRef, watch } from 'vue';
import { defineMenuButtonList, MDContextMenuBtn } from '@shared/ui/Menu';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';
import EditableInlineValue from './EditableInlineValue.vue';
import { useSnackbar } from '@shared/ui/Snackbar';
import { useDatabaseItemRemove } from '@feature/databaseItemRemove';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import DatabaseToolbar from './DatabaseToolbar.vue';
import { DbItemEditDialog } from '@feature/databaseItemEdit';
import { isUndefined } from 'es-toolkit';
import ValueField from './ValueField.vue';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';

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

watch(
  docHandle,
  () => {
    selectedViewId.value = databaseViewMap.list?.at(0)?.[0];
  },
  { immediate: true },
);

enum ITEM_CONTEXT_ACTION {
  edit,
  remove,
}

const itemContextualButtons = defineMenuButtonList([
  { symbolName: 'edit_note', label: 'edit', key: ITEM_CONTEXT_ACTION.edit },
  { symbolName: 'delete', label: 'remove', key: ITEM_CONTEXT_ACTION.remove },
]);

const { addSnackbar } = useSnackbar();

const { remove: removeItem } = useDatabaseItemRemove(docHandle);

const editedItemId = shallowRef<DatabaseItemId>();
const isShowEditItemDialog = computed({
  get: () => !isUndefined(editedItemId.value),
  set: (v) => {
    if (!v) {
      editedItemId.value = undefined;
    }
  },
});

const onClickItemContextBtn = async (
  { key: action }: { key: ITEM_CONTEXT_ACTION },
  itemId: DatabaseItemId,
) => {
  switch (action) {
    case ITEM_CONTEXT_ACTION.remove:
      await removeItem(itemId);
      break;

    case ITEM_CONTEXT_ACTION.edit: {
      editedItemId.value = itemId;
      break;
    }

    default:
      addSnackbar({
        text: 'work in progress',
      });
      break;
  }
};

const propertiesMap = useDatabasePropertiesMap(docHandle);

const onUpdateProperty = async (
  propertyId: DatabasePropertyId,
  v: DatabaseUnknownProperty,
) => {
  await propertiesMap.put(propertyId, v);
};

const hasProperties = computed(() => !!propertiesMap.size);

const databaseViewLayoutRef = useTemplateRef('databaseViewLayoutRef');
</script>

<template>
  <div class="database-view">
    <div v-if="documentError" class="database-view__error">
      <pre>{{ documentError }}</pre>
    </div>

    <div v-if="!hasProperties" class="database-view__without-properties">
      <h2 :class="MD_SYS_TYPESCALE.headline.large">Missing properties.</h2>

      <section :class="MD_SYS_TYPESCALE.body.medium">
        To start working with the database, create at least one property using
        the toolbar.
      </section>
    </div>

    <DatabaseViewLayout
      v-else
      ref="databaseViewLayoutRef"
      :doc-handle="docHandle"
      :view-id="selectedViewId"
      :directory="directory"
      class="database-view__layout"
    >
      <template #value="{ item, itemId, propertyId }">
        <EditableInlineValue
          :item="item"
          :property-id="propertyId"
          :doc-handle="docHandle"
          :directory="directory"
          @update:value="onChangeValue(itemId, propertyId, $event)"
          @update:property="onUpdateProperty(propertyId, $event)"
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
      :auto-hide-target="databaseViewLayoutRef"
    />

    <DbItemEditDialog
      v-if="isShowEditItemDialog"
      v-model:show="isShowEditItemDialog"
      :doc-handle="docHandle"
      :item-id="editedItemId"
      apply-label="Edit"
      @cancel="isShowEditItemDialog = false"
      @updated="isShowEditItemDialog = false"
    >
      <template #valueField="{ property, update, value }">
        <ValueField
          :property="property"
          :value="value"
          :directory="directory"
          @update:value="update"
        />
      </template>
    </DbItemEditDialog>
  </div>
</template>

<style lang="css" scoped>
.database-view {
  display: flex;
  flex-direction: column;
  flex: 1 0;
  overflow: auto;
  padding: 0 4step 4step;

  &__controls {
    margin-top: auto;
    flex-shrink: 0;
    position: sticky;
    bottom: 0;
    background: transparent;
  }

  &__table {
    flex-grow: 1;
  }

  &__without-properties {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4step;
    flex-grow: 1;
    text-align: center;
    padding: 4step;
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
