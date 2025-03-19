<script setup lang="ts">
import type { DocHandle } from '@automerge/automerge-repo';
import { DbItemAddDialog } from '@feature/databaseItemAdd';
import DatabasePropertyCreationDialog from '@feature/databasePropertyCreate/DatabasePropertyCreationDialog.vue';
import type { Item, UnknownProperty } from '@shared/lib/databaseDocument';
import { useDatabaseDocument } from '@shared/lib/databaseDocument';
import { MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDTable } from '@shared/ui/Table';
import { ref, toRef } from 'vue';
import DatabaseViewTable from './DatabaseViewTable.vue';

const { docHandle } = defineProps<{
  docHandle: DocHandle<unknown>;
}>();

const docHandleRef = toRef(() => docHandle);

const {
  addItem,
  addProperty,
  addSortDescription,
  addView,
  content,
  data,
  properties,
  removeItem,
  removeProperty,
  removeView,
  renameView,
  toggleSortDirection,
  updateItem,
  updateProperty,
  views,
} = useDatabaseDocument(docHandleRef);

const isShowAddProperty = ref(false);

const onClickAddProperty = () => {
  isShowAddProperty.value = true;
};

const onCreateProperty = async (property: UnknownProperty) => {
  await addProperty(property);
  isShowAddProperty.value = false;
};

const isShowAddItem = ref(false);

const onClickAddItem = () => {
  isShowAddItem.value = true;
};

const onAddItem = async (item: Item) => {
  await addItem(item);
  isShowAddItem.value = false;
};
</script>

<template>
  <div class="database-view">
    <DatabaseViewTable
      v-if="properties && data"
      class="database-view__table"
      :properties
      :data
    />

    <div v-else>empty</div>

    <MDFabContainer class="database-view__fab-container">
      <MDFab tooltip="Add property" size="small" @click="onClickAddProperty">
        <template #icon>
          <MDSymbol name="contextual_token_add" />
        </template>
      </MDFab>

      <MDFab tooltip="Add item" @click="onClickAddItem">
        <template #icon>
          <MDSymbol name="add" />
        </template>
      </MDFab>
    </MDFabContainer>

    <!-- TODO: создать нижний бар для кнопок -->
    <!-- TODO: создать MD таблицу из MDList -->

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
  </div>
</template>

<style lang="css" scoped>
.database-view {
  display: flex;
  flex-direction: column;
  flex: 1 0;
  overflow: auto;

  &__fab-container {
    margin-top: auto;
    flex-shrink: 0;
    position: sticky;
    bottom: 0;
  }

  &__table {
    flex-shrink: 0;
    flex-grow: 1;
    /* overflow: auto; */
    padding: 16px;
  }
}
</style>
