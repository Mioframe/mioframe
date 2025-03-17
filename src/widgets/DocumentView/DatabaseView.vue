<script setup lang="ts">
import type { DocHandle } from '@automerge/automerge-repo';
import { DbItemAddDialog } from '@feature/databaseItemAdd';
import DatabasePropertyCreationDialog from '@feature/databasePropertyCreate/DatabasePropertyCreationDialog.vue';
import type { UnknownProperty } from '@shared/lib/databaseDocument';
import { useDatabaseDocument } from '@shared/lib/databaseDocument';
import { MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { ref, toRef } from 'vue';

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
</script>

<template>
  <div class="database-view">
    <pre>{{ properties }}</pre>

    <pre>{{ data }}</pre>

    <MDFabContainer class="database-view__fab-container">
      <MDFab tooltip="addProperty" size="small" @click="onClickAddProperty">
        <MDSymbol name="contextual_token_add" />
      </MDFab>

      <MDFab tooltip="addItem" @click="onClickAddItem">
        <MDSymbol name="add" />
      </MDFab>
    </MDFabContainer>

    <!-- TODO: создать нижний бар для кнопок -->
    <!-- TODO: создать MD таблицу из MDList -->

    <DatabasePropertyCreationDialog
      v-if="isShowAddProperty"
      @create="onCreateProperty"
      @cancel="isShowAddProperty = false"
    />

    <DbItemAddDialog v-if="isShowAddItem && properties" :properties />
  </div>
</template>

<style lang="css" scoped>
.database-view {
  display: flex;
  flex-direction: column;
  flex: 1 1;
  overflow: auto;

  &__fab-container {
    margin-top: auto;
  }
}
</style>
