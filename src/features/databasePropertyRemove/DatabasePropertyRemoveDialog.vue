<script setup lang="ts">
import { useDatabasePropertiesClient } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import type { EntryPath } from '@shared/lib/fileSystem';
import { MDDialog } from '@shared/ui/Dialog';
import { MDSymbol } from '@shared/ui/Icon';
import { toRefs } from 'vue';

const props = defineProps<{
  directoryPath: EntryPath;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
}>();

const { directoryPath, documentId, propertyId } = toRefs(props);

const { remove } = useDatabasePropertiesClient();

const emit = defineEmits<{
  removed: [];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });

const onApplyRemoveProperty = async () => {
  await remove(directoryPath.value, documentId.value, propertyId.value);
  emit('removed');
};
</script>

<template>
  <MDDialog
    v-model:show="show"
    headline="Remove property?"
    supporting-text="Are you sure you want to delete the property and its data?"
    apply-label="Remove"
    has-cancel-action
    @apply="onApplyRemoveProperty"
    @cancel="emit('cancel')"
  >
    <template #icon>
      <MDSymbol name="delete" />
    </template>
  </MDDialog>
</template>
