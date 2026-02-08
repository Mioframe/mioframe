<script setup lang="ts">
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownProperty,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { computed, shallowRef, toRefs, useTemplateRef } from 'vue';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import EditableInlineValue from './EditableInlineValue.vue';
import { useSnackbar } from '@shared/ui/Snackbar';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import DatabaseToolbar from './DatabaseToolbar.vue';
import { DbItemEditDialog } from '@feature/databaseItemEdit';
import { isUndefined } from 'es-toolkit';
import ValueField from './ValueField.vue';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { useDatabaseProperties } from '@entity/databaseProperty';
import { DomainError } from '@shared/lib/error';
import { useDatabaseViews } from '@entity/databaseView';
import { useDatabaseData } from '@entity/databaseData/useDatabaseData';

const props = defineProps<{
  documentId: AMDocumentId;
  directoryPath: string;
}>();

const { directoryPath: path, documentId } = toRefs(props);

const firstViewId = computed(() => databaseViewList.value?.at(0)?.[0]);

const documentError = computed(() => {
  if (databaseViewList.value instanceof DomainError) {
    return databaseViewList.value;
  }

  return undefined;
});

const stateSelectedViewId = shallowRef<DatabaseViewId>();

const selectedViewId = computed({
  get: () => {
    return stateSelectedViewId.value ?? firstViewId.value;
  },
  set: (id) => (stateSelectedViewId.value = id),
});

const { views: databaseViewList } = useDatabaseViews(path, documentId);

enum ITEM_CONTEXT_ACTION {
  edit,
  remove,
}

const itemContextualButtons = defineMenuButtonList([
  { symbolName: 'edit_note', label: 'edit', key: ITEM_CONTEXT_ACTION.edit },
  { symbolName: 'delete', label: 'remove', key: ITEM_CONTEXT_ACTION.remove },
]);

const { addSnackbar } = useSnackbar();

const { removeItem } = useDatabaseData(path, documentId);

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

const { propertiesIdList, patch: putProperty } = useDatabaseProperties(
  path,
  documentId,
);

const onUpdateProperty = async (
  propertyId: DatabasePropertyId,
  v: DatabaseUnknownProperty,
) => {
  await putProperty(path.value, documentId.value, propertyId, v);
};

const hasProperties = computed(() =>
  propertiesIdList.value ? propertiesIdList.value.length > 0 : undefined,
);

const databaseViewRef = useTemplateRef('databaseViewRef');
</script>

<template>
  <div ref="databaseViewRef" class="database-view">
    <div v-if="documentError" class="database-view__error">
      <pre>{{ documentError }}</pre>
    </div>

    <div v-if="!hasProperties" class="database-view__without-properties">
      <h2 :class="MD_SYS_TYPESCALE.headline.large">Missing properties.</h2>

      <section :class="MD_SYS_TYPESCALE.body.medium">
        To start working with the database, create at least one property using
        the toolbar.
      </section>

      <DatabaseToolbar
        v-model:selected-view-id="selectedViewId"
        :document-id="documentId"
        :directory-path="path"
        :auto-hide-target="databaseViewRef"
      />
    </div>

    <DatabaseViewLayout
      v-else
      :document-id="documentId"
      :view-id="selectedViewId"
      :path="path"
      class="database-view__layout"
    >
      <template #value="{ itemId, propertyId }">
        <EditableInlineValue
          :item-id="itemId"
          :property-id="propertyId"
          :document-id="documentId"
          :directory-path="path"
          @update:property="onUpdateProperty(propertyId, $event)"
        />
      </template>

      <template #action="{ itemId }">
        <MDContextMenuButton
          :btns="itemContextualButtons"
          @click="onClickItemContextBtn($event, itemId)"
        />
      </template>

      <template #after>
        <DatabaseToolbar
          v-model:selected-view-id="selectedViewId"
          :document-id="documentId"
          :directory-path="path"
          :auto-hide-target="databaseViewRef"
        />
      </template>
    </DatabaseViewLayout>

    <DbItemEditDialog
      v-if="isShowEditItemDialog"
      v-model:show="isShowEditItemDialog"
      :directory-path="path"
      :document-id="documentId"
      :item-id="editedItemId"
      apply-label="Edit"
      @cancel="isShowEditItemDialog = false"
      @updated="isShowEditItemDialog = false"
    >
      <template #valueField="{ update, value, propertyId, index }">
        <ValueField
          :document-id="documentId"
          :property-id="propertyId"
          :value="value"
          :directory-path="path"
          :autofocus="!index"
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
  padding: 0 4step 0;

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
