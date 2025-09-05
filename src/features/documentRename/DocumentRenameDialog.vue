<script setup lang="ts">
import { computed, ref, toRef, watchEffect } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { useCFRDocument } from '@shared/lib/cfrDocument/useCFRDocument';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';
import { toRefs } from '@vueuse/core';

const { docHandle } = defineProps<{
  docHandle: AMDocHandle;
}>();

const emit = defineEmits<{
  renamed: [];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });

const cfrDocument = useCFRDocument(toRef(() => docHandle));

const { content, change } = toRefs(cfrDocument);

const stateName = ref<string>();

watchEffect(() => {
  stateName.value = content.value?.name;
});

const onApply = () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }

  const newName = stateName.value;

  change.value((doc) => (doc.name = newName));

  emit('renamed');
};

const onCancel = () => {
  stateName.value = undefined;
  emit('cancel');
};

const headline = computed(
  () => `Rename "${content.value?.name ?? 'unknown'}" document`,
);
</script>

<template>
  <MDDialog
    v-model:show="show"
    :headline="headline"
    supporting-text="Change the document title or leave it as is."
    apply-label="Rename"
    cancel-label="Cancel"
    has-cancel-action
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField v-model:model-value="stateName" label-text="Name" />
  </MDDialog>
</template>
