<script setup lang="ts">
import { useDatabaseViewSelection } from '@entity/databaseView';
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

const explicitViewId = defineModel<DatabaseViewId | undefined>('explicitViewId');

const props = defineProps<{
  documentId: AMDocumentId;
  directoryPath: string;
  autoHideTarget?: MaybeElement | undefined;
}>();

const { documentId, directoryPath: path, autoHideTarget } = toRefs(props);
const { explicitViewId: viewSelection, effectiveViewId } = useDatabaseViewSelection(
  path,
  documentId,
  explicitViewId,
);

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

const onToggleViewSettings = () => {
  showViewSettings.value = !showViewSettings.value;
};

const onToggleSortSettings = () => {
  showSortSettings.value = !showSortSettings.value;
};

const onToggleAddItemDialog = () => {
  isShowAddItem.value = !isShowAddItem.value;
};

const onToggleFilterSettings = () => {
  showFilterSettings.value = !showFilterSettings.value;
};

const onTogglePropertySettings = () => {
  showPropertySettings.value = !showPropertySettings.value;
};

const onCloseViewsSheet = () => {
  showViewSettings.value = false;
};

const onCloseSortSheet = () => {
  showSortSettings.value = false;
};

const onClosePropertiesSheet = () => {
  showPropertySettings.value = false;
};

const onCloseFiltersSheet = () => {
  showFilterSettings.value = false;
};

const onItemAdded = () => {
  isShowAddItem.value = false;
};

const onCancelAddItem = () => {
  isShowAddItem.value = false;
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
      @click="onToggleViewSettings"
    />

    <MDIconButton
      v-if="hasProperties"
      tooltip="sort"
      md-symbol-name="sort_by_alpha"
      @click="onToggleSortSettings"
    />

    <MDIconButton
      v-if="hasProperties"
      tooltip="add item"
      md-symbol-name="add"
      color="filled"
      width="wide"
      @click="onToggleAddItemDialog"
    />

    <MDIconButton
      v-if="hasProperties"
      tooltip="filter"
      md-symbol-name="filter_alt"
      @click="onToggleFilterSettings"
    />

    <MDIconButton
      tooltip="configure properties"
      md-symbol-name="tune"
      @click="onTogglePropertySettings"
    />

    <DatabaseViewsSheet
      v-if="showViewSettings"
      v-model:explicit-view-id="viewSelection"
      :path="path"
      :document-id="documentId"
      @closed="onCloseViewsSheet"
    />

    <DatabaseSortSheet
      v-if="showSortSettings"
      :directory-path="path"
      :document-id="documentId"
      :view-id="effectiveViewId"
      @closed="onCloseSortSheet"
    />

    <DatabasePropertiesSheet
      v-if="showPropertySettings"
      :document-id="documentId"
      :directory-path="path"
      @closed="onClosePropertiesSheet"
    />

    <DatabaseFiltersSheet
      v-if="showFilterSettings && effectiveViewId"
      :document-id="documentId"
      :view-id="effectiveViewId"
      :directory-path="path"
      @closed="onCloseFiltersSheet"
    />

    <DbItemAddDialog
      v-if="isShowAddItem"
      :directory-path="path"
      :document-id="documentId"
      @added="onItemAdded"
      @cancel="onCancelAddItem"
    >
      <template #valueField="{ update, value, propertyId, index }">
        <ValueField
          :value="value"
          :document-id="documentId"
          :property-id="propertyId"
          :directory-path="path"
          :autofocus="!index"
          @update:value="update"
          @update:property="($event) => onUpdateProperty(propertyId, $event)"
        />
      </template>
    </DbItemAddDialog>
  </MDToolbarContainer>
</template>
