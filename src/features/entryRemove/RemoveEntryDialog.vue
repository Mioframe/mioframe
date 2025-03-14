<script setup lang="ts">
import { computed, ref } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';

const { name } = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  cancel: [];
  remove: [name: string];
}>();

const loading = ref(0);

const onSubmit = () => {
  loading.value += 1;
  emit('remove', name);
};

const onClickCancel = () => {
  emit('cancel');
};

const headline = computed(() => `Remove "${name}"?`);

const supportingText = computed(
  () => `Are you sure you want to remove "${name}"?`,
);
</script>

<template>
  <MDDialog
    :headline
    :supporting-text
    cancel-label="Cancel"
    apply-label="Remove"
    :loading="!!loading"
    has-cancel-action
    @apply="onSubmit"
    @cancel="onClickCancel"
  />
</template>
