<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument/useDatabasePropertiesMap';
import { MDDialog } from '@shared/ui/Dialog';
import { MDSymbol } from '@shared/ui/Icon';
import { toRefs } from 'vue';

const props = defineProps<{
  docHandle: AMDocHandle;
  propertyId: DatabasePropertyId;
}>();

const { docHandle, propertyId } = toRefs(props);

const propertyMap = useDatabasePropertiesMap(docHandle);

const emit = defineEmits<{
  removed: [];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });

const onApplyRemoveProperty = async () => {
  await propertyMap.remove(propertyId.value);
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
