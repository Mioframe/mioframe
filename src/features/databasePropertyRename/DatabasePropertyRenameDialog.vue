<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import type { DatabasePropertyId } from '@shared/lib/databaseDocument';
import { useDatabasePropertiesMap } from '@shared/lib/databaseDocument/useDatabasePropertiesMap';
import { MDDialog } from '@shared/ui/Dialog';
import { MDSymbol } from '@shared/ui/Icon';
import { MDTextField } from '@shared/ui/TextField';
import { computed, ref, toRefs, watchEffect } from 'vue';

const props = defineProps<{
  docHandle: AMDocHandle;
  propertyId: DatabasePropertyId;
}>();

const { docHandle, propertyId } = toRefs(props);

const propertyMap = useDatabasePropertiesMap(docHandle);

const currentName = computed(() => propertyMap.get(propertyId.value)?.name);

const stateName = ref<string>();

watchEffect(() => {
  stateName.value = currentName.value;
});

const emit = defineEmits<{
  renamed: [newName: string];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });

const onApply = async () => {
  if (stateName.value?.length) {
    await propertyMap.put(propertyId.value, { name: stateName.value });
    emit('renamed', stateName.value);
  }
};

const onCancel = () => {
  stateName.value = undefined;
  emit('cancel');
};
</script>

<template>
  <MDDialog
    v-model:show="show"
    headline="Rename property"
    supporting-text="Enter a new property name"
    apply-label="Save"
    has-cancel-action
    @apply="onApply"
    @cancel="onCancel"
  >
    <template #icon>
      <MDSymbol name="edit" />
    </template>

    <MDTextField v-model:model-value="stateName" label-text="Property name" />
  </MDDialog>
</template>
