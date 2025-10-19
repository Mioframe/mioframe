<script setup lang="ts">
import DatabaseItemSortingListSection from '@feature/databaseItemSorting/DatabaseItemSortingListSection.vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import type { EntryPath } from '@shared/lib/fileSystem';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';

defineProps<{
  viewId?: DatabaseViewId;
  directoryPath: EntryPath;
  documentId: AMDocumentId;
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
    label="Database Sort Sheet"
    @update:collapsed="onUpdateCollapsed"
  >
    <MDBottomSheetSection class="md-padding-4">
      <DatabaseItemSortingListSection
        v-if="viewId"
        :directory-path="directoryPath"
        :document-id="documentId"
        :view-id="viewId"
      />
    </MDBottomSheetSection>
  </MDBottomSheet>
</template>
