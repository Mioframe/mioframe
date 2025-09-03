<script setup lang="ts">
import DatabaseItemSortingListSection from '@feature/databaseItemSorting/DatabaseItemSortingListSection.vue';
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';

defineProps<{
  viewId?: DatabaseViewId;
  docHandle: AMDocHandle;
}>();

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
    :collapsed="false"
    type="modal"
    label="Database Sort Sheet"
    @update:collapsed="onUpdateCollapsed"
    @click-container="showModel = false"
  >
    <MDBottomSheetSection scroll-snap-align="end" class="md-padding-4">
      <DatabaseItemSortingListSection
        v-if="viewId"
        :doc-handle="docHandle"
        :view-id="viewId"
      />
    </MDBottomSheetSection>
  </MDBottomSheet>
</template>
