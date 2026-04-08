<script setup lang="ts">
import { useDatabaseProperties } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import { MDDialog } from '@shared/ui/Dialog';
import { MDSymbol } from '@shared/ui/Icon';
import { toRefs } from 'vue';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
}>();

const { path, documentId, propertyId } = toRefs(props);

const { remove } = useDatabaseProperties(path, documentId);

const emit = defineEmits<{
  removed: [];
  cancel: [];
}>();

const onApplyRemoveProperty = async () => {
  await remove(propertyId.value);
  emit('removed');
};
</script>

<template>
  <MDDialog
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
