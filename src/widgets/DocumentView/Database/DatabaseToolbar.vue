<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId, DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { type DatabaseViewId } from '@shared/lib/databaseDocument';
import { MDIconButton } from '@shared/ui/Button';
import MDToolbarContainer from '@shared/ui/Toolbar/MDToolbarContainer.vue';
import { computed, ref, toRefs } from 'vue';
import DatabaseViewsSheet from './DatabaseViewsSheet.vue';
import DatabaseSortSheet from './DatabaseSortSheet.vue';
import DatabasePropertiesSheet from './DatabasePropertiesSheet.vue';
import { DbItemAddDialog } from '@feature/databaseItemEdit';
import ValueField from './ValueField.vue';
import type { MaybeElement } from '@vueuse/core';
import DatabaseFiltersSheet from './DatabaseFiltersSheet.vue';
import { useDatabaseProperties } from '@entity/databaseProperty';
import type { PartialDeep } from 'type-fest';

const selectedViewId = defineModel<DatabaseViewId | undefined>('selectedViewId');

const props = defineProps<{
  documentId: AMDocumentId;
  directoryPath: string;
  autoHideTarget?: MaybeElement | undefined;
}>();

const { documentId, directoryPath: path, autoHideTarget } = toRefs(props);

const showViewSettings = ref(false);

const showSortSettings = ref(false);

const showPropertySettings = ref(false);

const showFilterSettings = ref(false);

const isShowAddItem = ref(false);

const { size: propertySize, patch: patchProperty } = useDatabaseProperties(path, documentId);

const onUpdateProperty = async (
  propertyId: DatabasePropertyId,
  v: PartialDeep<DatabaseUnknownProperty>,
) => {
  await patchProperty(path.value, documentId.value, propertyId, v);
};

const hasProperties = computed(() => {
  const size = propertySize.value;

  return size && size > 0;
});
</script>

<template>
  <MDToolbarContainer type="floating" auto-hide :auto-hide-target="autoHideTarget">
    <MDIconButton
      v-if="hasProperties"
      tooltip="view settings"
      md-symbol-name="view_quilt"
      @click="showViewSettings = !showViewSettings"
    />

    <MDIconButton
      v-if="hasProperties"
      tooltip="sort"
      md-symbol-name="sort_by_alpha"
      @click="showSortSettings = !showSortSettings"
    />

    <MDIconButton
      v-if="hasProperties"
      tooltip="add item"
      md-symbol-name="add"
      color="filled"
      width="wide"
      @click="isShowAddItem = !isShowAddItem"
    />

    <MDIconButton
      v-if="hasProperties"
      tooltip="filter"
      md-symbol-name="filter_alt"
      @click="showFilterSettings = !showFilterSettings"
    />

    <MDIconButton
      tooltip="configure properties"
      md-symbol-name="tune"
      @click="showPropertySettings = !showPropertySettings"
    />

    <DatabaseViewsSheet
      v-if="showViewSettings"
      v-model:selected-view-id="selectedViewId"
      :path="path"
      :document-id="documentId"
      @closed="showViewSettings = false"
    />

    <DatabaseSortSheet
      v-if="showSortSettings"
      :directory-path="path"
      :document-id="documentId"
      :view-id="selectedViewId"
      @closed="showSortSettings = false"
    />

    <DatabasePropertiesSheet
      v-if="showPropertySettings"
      :document-id="documentId"
      :directory-path="path"
      @closed="showPropertySettings = false"
    />

    <DatabaseFiltersSheet
      v-if="showFilterSettings && selectedViewId"
      :document-id="documentId"
      :view-id="selectedViewId"
      :directory-path="path"
      @closed="showFilterSettings = false"
    />

    <DbItemAddDialog
      v-if="isShowAddItem"
      :directory-path="path"
      :document-id="documentId"
      @added="isShowAddItem = false"
      @cancel="isShowAddItem = false"
    >
      <template #valueField="{ update, value, propertyId, index }">
        <ValueField
          :value="value"
          :document-id="documentId"
          :property-id="propertyId"
          :directory-path="path"
          :autofocus="!index"
          @update:value="update"
          @update:property="onUpdateProperty(propertyId, $event)"
        />
      </template>
    </DbItemAddDialog>
  </MDToolbarContainer>
</template>
