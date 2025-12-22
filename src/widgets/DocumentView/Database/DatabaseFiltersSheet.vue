<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';
import { toRefs } from 'vue';
import ValueField from './ValueField.vue';
import { DatabaseFilterEditString } from '@feature/databaseFilterEdit';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  viewId: DatabaseViewId;
}>();

const { directoryPath, documentId, viewId } = toRefs(props);

const showModel = defineModel<boolean>('show', { required: true });

const onUpdateCollapsed = (collapsed: boolean) => {
  if (collapsed) {
    showModel.value = false;
  }
};
</script>

<template>
  <MDBottomSheet
    v-model:show="showModel"
    class="db-filters-sheet"
    label="Database Filters Sheet"
    @update:collapsed="onUpdateCollapsed"
  >
    <MDBottomSheetSection class="db-filters-sheet__section">
      <span :class="MD_SYS_TYPESCALE.title.small">Filters</span>

      <div class="db-filters-sheet__filters">
        <DatabaseFilterEditString
          :directory-path="directoryPath"
          :document-id="documentId"
          :view-id="viewId"
          class="db-filters-sheet__root-filter"
        >
          <template #valueField="{ update, value, propertyId }">
            <ValueField
              :document-id="documentId"
              :property-id="propertyId"
              :value="value"
              :directory-path="directoryPath"
              @update:value="update"
            />
          </template>
        </DatabaseFilterEditString>
      </div>
    </MDBottomSheetSection>
  </MDBottomSheet>
</template>

<style lang="css" scoped>
.db-filters-sheet {
  &__section {
    display: flex;
    flex-direction: column;
    gap: 4step;
    padding: 0 4step 4step;
  }

  &__filter-list {
    &:empty {
      display: none;
    }
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 2step;
  }

  &__filters {
    display: flex;
    :deep() {
      .filter-block_odd {
        --md-container-color: var(--md-sys-color-surface-container-high);
        --md-content-color: var(--md-sys-color-on-surface-container-high);
      }
      .filter-block_even {
        --md-container-color: var(--md-bottom-sheet-container-color);
        --md-content-color: var(--md-bottom-sheet-content-color);
      }
    }
  }

  &__root-filter {
    padding: 0;
  }
}
</style>
