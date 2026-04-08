<script setup lang="ts">
import { computed, ref } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { stringPath } from '@shared/service/directories';

const { path } = defineProps<{
  path: string;
}>();

const emit = defineEmits<{
  cancel: [];
  apply: [path: string];
}>();

const loading = ref(0);

const onSubmit = () => {
  loading.value += 1;
  emit('apply', path);
};

const onClickCancel = () => {
  emit('cancel');
};

const name = computed(() => path.at(path.length - 1));

const headline = computed(
  () => `Remove ${name.value ? `"${name.value}"` : 'entry'} ?`,
);

const supportingText = computed(
  () => `Are you sure you want to remove "${stringPath(path)}"?`,
);
</script>

<template>
  <MDDialog
    :headline="headline"
    :supporting-text="supportingText"
    cancel-label="Cancel"
    apply-label="Remove"
    :loading="!!loading"
    has-cancel-action
    @apply="onSubmit"
    @cancel="onClickCancel"
  />
</template>
