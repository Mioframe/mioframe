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
import { DatabaseItemEditDialog } from '@feature/databaseItemEdit';
import { isUndefined } from 'es-toolkit';
import DatabasePropertyValueFieldById from './DatabasePropertyValueFieldById.vue';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { useDatabaseProperties } from '@entity/databaseProperty';
import { DomainError } from '@shared/lib/error';
import { useDatabaseViewSelection } from '@entity/databaseView';
import { useDatabaseData } from '@entity/databaseData/useDatabaseData';
import {
  DatabaseExampleDocumentCreateSuccessCard,
  useDatabaseExampleDocumentCreateSuccess,
} from '@feature/exampleDocumentsCreate';

const props = defineProps<{
  documentId: AMDocumentId;
  directoryPath: string;
}>();

const { directoryPath: path, documentId } = toRefs(props);
const { isVisible: isSuccessCardVisible, dismiss: dismissSuccessCard } =
  useDatabaseExampleDocumentCreateSuccess(path, documentId);
const stateExplicitViewId = shallowRef<DatabaseViewId>();
const {
  viewList: databaseViewList,
  explicitViewId,
  effectiveViewId,
} = useDatabaseViewSelection(path, documentId, stateExplicitViewId);

const documentError = computed(() => {
  if (databaseViewList.value instanceof DomainError) {
    return databaseViewList.value;
  }

  return undefined;
});

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

const { propertiesIdList, patch: putProperty } = useDatabaseProperties(path, documentId);

const onUpdateProperty = async (propertyId: DatabasePropertyId, v: DatabaseUnknownProperty) => {
  await putProperty(path.value, documentId.value, propertyId, v);
};

const hasProperties = computed(() =>
  propertiesIdList.value ? propertiesIdList.value.length > 0 : undefined,
);

const databaseViewRef = useTemplateRef('databaseViewRef');

const onCancelEditItemDialog = () => {
  isShowEditItemDialog.value = false;
};

const onUpdatedEditItemDialog = () => {
  isShowEditItemDialog.value = false;
};
</script>

<template>
  <div ref="databaseViewRef" class="database-view">
    <DatabaseExampleDocumentCreateSuccessCard
      v-if="isSuccessCardVisible"
      class="database-view__success-card"
      @dismiss="dismissSuccessCard"
    />

    <div v-if="documentError" class="database-view__error">
      <pre>{{ documentError }}</pre>
    </div>

    <div v-if="!hasProperties" class="database-view__without-properties">
      <h2 :class="MD_SYS_TYPESCALE.headline.large">Missing properties.</h2>

      <section :class="MD_SYS_TYPESCALE.body.medium">
        To start working with the database, create at least one property using the toolbar.
      </section>

      <DatabaseToolbar
        v-model:explicit-view-id="explicitViewId"
        :document-id="documentId"
        :directory-path="path"
        :auto-hide-target="databaseViewRef"
      />
    </div>

    <DatabaseViewLayout
      v-else
      :document-id="documentId"
      :view-id="effectiveViewId"
      :path="path"
      class="database-view__layout"
    >
      <template #value="{ itemId, propertyId }">
        <EditableInlineValue
          :item-id="itemId"
          :property-id="propertyId"
          :document-id="documentId"
          :directory-path="path"
          @update:property="($event) => onUpdateProperty(propertyId, $event)"
        />
      </template>

      <template #action="{ itemId }">
        <MDContextMenuButton
          :btns="itemContextualButtons"
          @click="($event) => onClickItemContextBtn($event, itemId)"
        />
      </template>

      <template #after>
        <DatabaseToolbar
          v-model:explicit-view-id="explicitViewId"
          :document-id="documentId"
          :directory-path="path"
          :auto-hide-target="databaseViewRef"
        />
      </template>
    </DatabaseViewLayout>

    <DatabaseItemEditDialog
      v-if="isShowEditItemDialog"
      :directory-path="path"
      :document-id="documentId"
      :item-id="editedItemId"
      apply-label="Edit"
      @cancel="onCancelEditItemDialog"
      @updated="onUpdatedEditItemDialog"
    >
      <template #valueField="{ update, value, propertyId, index }">
        <DatabasePropertyValueFieldById
          :document-id="documentId"
          :property-id="propertyId"
          :value="value"
          :directory-path="path"
          :autofocus="!index"
          @update:value="update"
          @update:property="($event) => onUpdateProperty(propertyId, $event)"
        />
      </template>
    </DatabaseItemEditDialog>
  </div>
</template>

<style lang="css" scoped>
.database-view {
  display: flex;
  flex-direction: column;
  flex: 1 0;
  overflow: auto;
  padding: 0 4step 0;
  gap: 2step;

  &__success-card {
    flex-shrink: 0;
  }

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
