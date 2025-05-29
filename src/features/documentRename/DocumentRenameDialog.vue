<script setup lang="ts">
import { ref, toRef, watchEffect } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import type { DocHandle } from '@automerge/automerge-repo';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import type { UnknownRecord } from 'type-fest';

const { docHandle } = defineProps<{
  docHandle: DocHandle<UnknownRecord>;
}>();

const emit = defineEmits<{
  renamed: [];
  cancel: [];
}>();

const { name: oldName, change } = useCFRDocument(toRef(() => docHandle));

const stateName = ref<string>();

watchEffect(() => {
  stateName.value = oldName.value;
});

const onApply = () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }

  const newName = stateName.value;

  change((doc) => (doc.name = newName));

  emit('renamed');
};

const onCancel = () => {
  stateName.value = undefined;
  emit('cancel');
};
</script>

<template>
  <MDDialog
    headline="Rename Document"
    supporting-text="Change the document title or leave it as is."
    apply-label="Apply"
    cancel-label="Cancel"
    has-cancel-action
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField v-model:model-value="stateName" label-text="Name" />
  </MDDialog>
</template>
