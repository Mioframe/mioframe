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
import DatabasePropertyValueFieldById from './DatabasePropertyValueFieldById.vue';
import type { MaybeElement } from '@vueuse/core';
import DatabaseFiltersSheet from './DatabaseFiltersSheet.vue';
import { useDatabaseProperties } from '@entity/databaseProperty';
import type { PartialDeep } from 'type-fest';
import type { DatabaseConfigurationSurface } from './databaseConfigurationSurface';

const explicitViewId = defineModel<DatabaseViewId | undefined>('explicitViewId');

const props = defineProps<{
  documentId: AMDocumentId;
  directoryPath: string;
  autoHideTarget?: MaybeElement | undefined;
  activeConfigurationSurface?: DatabaseConfigurationSurface | undefined;
}>();

const emit = defineEmits<{
  requestConfiguration: [surface: DatabaseConfigurationSurface];
  closeConfiguration: [];
}>();

const {
  documentId,
  directoryPath: path,
  autoHideTarget,
  activeConfigurationSurface,
} = toRefs(props);
const { explicitViewId: viewSelection, effectiveViewId } = useDatabaseViewSelection(
  path,
  documentId,
  explicitViewId,
);

const isShowAddItem = ref(false);

const { size: propertySize, patch: patchProperty } = useDatabaseProperties(path, documentId);

const onUpdateProperty = async (
  propertyId: DatabasePropertyId,
  v: PartialDeep<DatabaseUnknownProperty>,
) => {
  await patchProperty(path.value, documentId.value, propertyId, v);
};

const onRequestViewSettings = () => {
  emit('requestConfiguration', 'views');
};

const onRequestSortSettings = () => {
  emit('requestConfiguration', 'sort');
};

const onToggleAddItemDialog = () => {
  isShowAddItem.value = !isShowAddItem.value;
};

const onRequestFilterSettings = () => {
  emit('requestConfiguration', 'filter');
};

const onRequestPropertySettings = () => {
  emit('requestConfiguration', 'properties');
};

const onCloseConfiguration = () => {
  emit('closeConfiguration');
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
      color="standard"
      @click="onRequestViewSettings"
    />

    <MDIconButton
      v-if="hasProperties"
      tooltip="sort"
      md-symbol-name="sort_by_alpha"
      color="standard"
      @click="onRequestSortSettings"
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
      color="standard"
      @click="onRequestFilterSettings"
    />

    <MDIconButton
      tooltip="configure properties"
      md-symbol-name="tune"
      color="standard"
      @click="onRequestPropertySettings"
    />

    <DatabaseViewsSheet
      v-if="activeConfigurationSurface === 'views'"
      v-model:explicit-view-id="viewSelection"
      :path="path"
      :document-id="documentId"
      @closed="onCloseConfiguration"
    />

    <DatabaseSortSheet
      v-if="activeConfigurationSurface === 'sort'"
      :directory-path="path"
      :document-id="documentId"
      :view-id="effectiveViewId"
      @closed="onCloseConfiguration"
    />

    <DatabasePropertiesSheet
      v-if="activeConfigurationSurface === 'properties'"
      :document-id="documentId"
      :directory-path="path"
      @closed="onCloseConfiguration"
    />

    <DatabaseFiltersSheet
      v-if="activeConfigurationSurface === 'filter' && effectiveViewId"
      :document-id="documentId"
      :view-id="effectiveViewId"
      :directory-path="path"
      @closed="onCloseConfiguration"
    />

    <DbItemAddDialog
      v-if="isShowAddItem"
      :directory-path="path"
      :document-id="documentId"
      @added="onItemAdded"
      @cancel="onCancelAddItem"
    >
      <template #valueField="{ update, value, propertyId, index }">
        <DatabasePropertyValueFieldById
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
