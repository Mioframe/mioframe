<script setup lang="ts">
import DatabaseItemSortingListSection from '@feature/databaseItemSorting/DatabaseItemSortingListSection.vue';
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';

defineProps<{
  viewId?: DatabaseViewId;
  docHandle: AMDocHandle;
}>();

const show = defineModel<boolean>('show', { required: true });

const onUpdateCollapsed = (collapsed: boolean) => {
  if (collapsed) {
    show.value = false;
  }
};
</script>

<template>
  <MDBottomSheet
    :show="show"
    :collapsed="false"
    @update:collapsed="onUpdateCollapsed"
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
