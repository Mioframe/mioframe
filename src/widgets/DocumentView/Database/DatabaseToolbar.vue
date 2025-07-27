<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import { type DatabaseViewId } from '@shared/lib/databaseDocument';
import { MDIconButton } from '@shared/ui/Button';
import MDToolbarContainer from '@shared/ui/Toolbar/MDToolbarContainer.vue';
import { ref, toRefs } from 'vue';
import DatabaseViewsSheet from './DatabaseViewsSheet.vue';
import DatabaseSortSheet from './DatabaseSortSheet.vue';
import DatabasePropertiesSheet from './DatabasePropertiesSheet.vue';
import { DbItemAddDialog } from '@feature/databaseItemEdit';
import ValueField from './ValueField.vue';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';

const props = defineProps<{
  docHandle: AMDocHandle;
  directory: DirectoryFSEntry;
}>();

const { docHandle, directory } = toRefs(props);

const selectedViewId = defineModel<DatabaseViewId>('selectedViewId');

const showViewSettings = ref(false);

const showSortSettings = ref(false);

const showPropertySettings = ref(false);

const isShowAddItem = ref(false);
</script>

<template>
  <MDToolbarContainer type="floating" auto-hide>
    <MDIconButton
      tooltip="view settings"
      md-symbol-name="view_quilt"
      @click="showViewSettings = !showViewSettings"
    />

    <MDIconButton
      tooltip="sort"
      md-symbol-name="sort_by_alpha"
      @click="showSortSettings = !showSortSettings"
    />

    <MDIconButton
      tooltip="add item"
      md-symbol-name="add"
      color="filled"
      width="wide"
      @click="isShowAddItem = !isShowAddItem"
    />

    <!-- <MDIconButton tooltip="filter" md-symbol-name="filter_alt" /> -->

    <!-- TODO: добавить кнопку добавление записи -->

    <MDIconButton
      tooltip="configure properties"
      md-symbol-name="tune"
      @click="showPropertySettings = !showPropertySettings"
    />

    <DatabaseViewsSheet
      v-model:selected-view-id="selectedViewId"
      v-model:show="showViewSettings"
      :doc-handle="docHandle"
    />

    <DatabaseSortSheet
      v-model:show="showSortSettings"
      :view-id="selectedViewId"
      :doc-handle="docHandle"
    />

    <DatabasePropertiesSheet
      v-model:show="showPropertySettings"
      :doc-handle="docHandle"
      :directory="directory"
    />

    <DbItemAddDialog
      v-if="isShowAddItem"
      v-model:show="isShowAddItem"
      :doc-handle="docHandle"
      @added="isShowAddItem = false"
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
  </MDToolbarContainer>
</template>
