<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { type DatabaseViewId } from '@shared/lib/databaseDocument';
import { MDIconButton } from '@shared/ui/Button';
import MDToolbarContainer from '@shared/ui/Toolbar/MDToolbarContainer.vue';
import { computed, ref, toRefs } from 'vue';
import DatabaseViewsSheet from './DatabaseViewsSheet.vue';
import DatabaseSortSheet from './DatabaseSortSheet.vue';
import DatabasePropertiesSheet from './DatabasePropertiesSheet.vue';
import { DbItemAddDialog } from '@feature/databaseItemEdit';
import ValueField from './ValueField.vue';
import type { EntryPath } from '@shared/lib/fileSystem';
import type { MaybeElement } from '@vueuse/core';
import DatabaseFiltersSheet from './DatabaseFiltersSheet.vue';
import { useDatabasePropertiesClient } from '@entity/databaseProperty';
import { DomainError } from '@shared/lib/error';
import type { PartialDeep } from 'type-fest';

const props = defineProps<{
  documentId: AMDocumentId;
  directoryPath: EntryPath;
  autoHideTarget?: MaybeElement;
}>();

const { documentId, directoryPath, autoHideTarget } = toRefs(props);

const selectedViewId = defineModel<DatabaseViewId>('selectedViewId');

const showViewSettings = ref(false);

const showSortSettings = ref(false);

const showPropertySettings = ref(false);

const showFilterSettings = ref(false);

const isShowAddItem = ref(false);

const { getPropertySize, patch: patchProperty } = useDatabasePropertiesClient();

const onUpdateProperty = async (
  propertyId: DatabasePropertyId,
  v: PartialDeep<DatabaseUnknownProperty>,
) => {
  await patchProperty(directoryPath.value, documentId.value, propertyId, v);
};

const hasProperties = computed(() => {
  const size = getPropertySize(directoryPath.value, documentId.value);

  return !(size instanceof DomainError) && size && size > 0;
});
</script>

<template>
  <MDToolbarContainer
    type="floating"
    auto-hide
    :auto-hide-target="autoHideTarget"
  >
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
      v-model:selected-view-id="selectedViewId"
      v-model:show="showViewSettings"
      :directory-path="directoryPath"
      :document-id="documentId"
    />

    <DatabaseSortSheet
      v-model:show="showSortSettings"
      :directory-path="directoryPath"
      :document-id="documentId"
      :view-id="selectedViewId"
    />

    <DatabasePropertiesSheet
      v-model:show="showPropertySettings"
      :document-id="documentId"
      :directory-path="directoryPath"
    />

    <DatabaseFiltersSheet
      v-if="selectedViewId"
      v-model:show="showFilterSettings"
      :document-id="documentId"
      :view-id="selectedViewId"
      :directory-path="directoryPath"
    />

    <DbItemAddDialog
      v-if="isShowAddItem"
      v-model:show="isShowAddItem"
      :directory-path="directoryPath"
      :document-id="documentId"
      @added="isShowAddItem = false"
      @cancel="isShowAddItem = false"
    >
      <template #valueField="{ property, update, value, propertyId }">
        <ValueField
          :property="property"
          :value="value"
          :directory-path="directoryPath"
          @update:value="update"
          @update:property="onUpdateProperty(propertyId, $event)"
        />
      </template>
    </DbItemAddDialog>
  </MDToolbarContainer>
</template>
