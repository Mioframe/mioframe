<script setup lang="ts">
import DatabaseItemSortingListSection from '@feature/databaseItemSorting/DatabaseItemSortingListSection.vue';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { MDBottomSheet, MDBottomSheetSection } from '@shared/ui/Sheets';

defineProps<{
  viewId?: DatabaseViewId | undefined;
  directoryPath: string;
  documentId: AMDocumentId;
}>();

const emit = defineEmits<{
  closed: [];
}>();

const onClosed = () => {
  emit('closed');
};
</script>

<template>
  <MDBottomSheet label="Database Sort Sheet" @closed="onClosed">
    <MDBottomSheetSection class="md-padding-4">
      <DatabaseItemSortingListSection
        v-if="viewId"
        :path="directoryPath"
        :document-id="documentId"
        :view-id="viewId"
      />
    </MDBottomSheetSection>
  </MDBottomSheet>
</template>
