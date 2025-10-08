<script setup lang="ts">
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownProperty,
  DatabaseValue,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { computed, shallowRef, toRefs, useTemplateRef } from 'vue';
import { defineMenuButtonList, MDContextMenuBtn } from '@shared/ui/Menu';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import EditableInlineValue from './EditableInlineValue.vue';
import { useSnackbar } from '@shared/ui/Snackbar';
import { useDatabaseItemRemove } from '@feature/databaseItemRemove';
import type { EntryPath } from '@shared/lib/fileSystem';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import DatabaseToolbar from './DatabaseToolbar.vue';
import { DbItemEditDialog } from '@feature/databaseItemEdit';
import { isUndefined } from 'es-toolkit';
import ValueField from './ValueField.vue';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { strictRecordSize } from '@shared/lib/strictRecord';
import { useDatabasePropertiesClient } from '@entity/databaseProperty';
import { useDatabaseDataClient } from '@entity/databaseData/client';
import { useDatabaseViewsClient } from '@entity/databaseView/viewsClient';
import { DomainError } from '@shared/lib/error';

const props = defineProps<{
  documentId: AMDocumentId;
  directoryPath: EntryPath;
}>();

const { directoryPath, documentId } = toRefs(props);

const documentError = computed(() => {
  if (databaseViewList.value instanceof DomainError) {
    return databaseViewList.value;
  }

  if (firstViewId.value instanceof DomainError) {
    return firstViewId.value;
  }
  return undefined;
});

const { postValue } = useDatabaseDataClient();

const onChangeValue = async (
  itemId: DatabaseItemId,
  propertyId: DatabasePropertyId,
  value: DatabaseValue,
) => {
  await postValue(
    directoryPath.value,
    documentId.value,
    itemId,
    propertyId,
    value,
  );
};

const firstViewId = computed(() => {
  if (databaseViewList.value instanceof DomainError) {
    return databaseViewList.value;
  }
  return databaseViewList.value?.at(0)?.[0];
});

const stateSelectedViewId = shallowRef<DatabaseViewId>();

const selectedViewId = computed({
  get: () => {
    return (
      stateSelectedViewId.value ??
      (firstViewId.value instanceof DomainError ? undefined : firstViewId.value)
    );
  },
  set: (id) => (stateSelectedViewId.value = id),
});

const { getViewList } = useDatabaseViewsClient();

const databaseViewList = computed(() =>
  getViewList(directoryPath.value, documentId.value),
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

const { remove: removeItem } = useDatabaseItemRemove();

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
      await removeItem(directoryPath.value, documentId.value, itemId);
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

const { getDatabaseProperties } = useDatabasePropertiesClient();

const databaseProperties = computed(() =>
  getDatabaseProperties(directoryPath.value, documentId.value),
);

const { patch: putProperty } = useDatabasePropertiesClient();

const onUpdateProperty = async (
  propertyId: DatabasePropertyId,
  v: DatabaseUnknownProperty,
) => {
  await putProperty(directoryPath.value, documentId.value, propertyId, v);
};

const hasProperties = computed(() =>
  databaseProperties.value && !(databaseProperties.value instanceof DomainError)
    ? strictRecordSize(databaseProperties.value) > 0
    : undefined,
);

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
      :document-id="documentId"
      :view-id="selectedViewId"
      :directory-path="directoryPath"
      class="database-view__layout"
    >
      <template #value="{ itemId, propertyId }">
        <EditableInlineValue
          :item-id="itemId"
          :property-id="propertyId"
          :document-id="documentId"
          :directory-path="directoryPath"
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
      :document-id="documentId"
      :directory-path="directoryPath"
      :auto-hide-target="databaseViewLayoutRef"
    />

    <DbItemEditDialog
      v-if="isShowEditItemDialog"
      v-model:show="isShowEditItemDialog"
      :directory-path="directoryPath"
      :document-id="documentId"
      :item-id="editedItemId"
      apply-label="Edit"
      @cancel="isShowEditItemDialog = false"
      @updated="isShowEditItemDialog = false"
    >
      <template #valueField="{ property, update, value }">
        <ValueField
          :property="property"
          :value="value"
          :directory-path="directoryPath"
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
