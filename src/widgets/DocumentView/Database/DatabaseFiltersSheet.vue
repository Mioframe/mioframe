<script setup lang="ts">
import { DatabaseFilterEditString } from '@feature/databaseFilterEdit';
import type { AMDocHandle } from '@shared/lib/automerge';
import type {
  DatabaseFilter,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useDatabaseFilter } from '@shared/lib/databaseDocument/useDatabaseFilter';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';
import { computed, ref, toRefs, watchEffect } from 'vue';
import ValueField from './ValueField.vue';

const props = defineProps<{
  docHandle: AMDocHandle;
  directory: DirectoryFSEntry;
  viewId: DatabaseViewId;
}>();

const { docHandle, viewId } = toRefs(props);

const showModel = defineModel<boolean>('show', { required: true });

const onUpdateCollapsed = (collapsed: boolean) => {
  if (collapsed) {
    showModel.value = false;
  }
};

const databaseFilter = useDatabaseFilter(docHandle, viewId);

const filter = computed(() => databaseFilter.filter ?? {});

const filterState = ref<DatabaseFilter>({});

watchEffect(() => {
  filterState.value = filter.value;
});
</script>

<template>
  <MDBottomSheet
    v-model:show="showModel"
    :collapsed="false"
    type="modal"
    class="db-filters-sheet"
    label="Database Filters Sheet"
    @update:collapsed="onUpdateCollapsed"
    @click-container="showModel = false"
  >
    <MDBottomSheetSection
      class="db-filters-sheet__section"
      scroll-snap-align="end"
    >
      <span :class="MD_SYS_TYPESCALE.title.small">Filters</span>

      <div class="db-filters-sheet__filters">
        <DatabaseFilterEditString
          :doc-handle="docHandle"
          :view-id="viewId"
          class="db-filters-sheet__root-filter"
        >
          <template #valueField="{ property, update, value }">
            <ValueField
              :property="property"
              :value="value"
              :directory="directory"
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
