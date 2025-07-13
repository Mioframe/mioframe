<script setup lang="ts">
import { computed, ref } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';

const { name } = defineProps<{
  name: string;
}>();

const emit = defineEmits<{
  cancel: [];
  apply: [name: string];
}>();

const show = defineModel<boolean>('show', { required: true });

const loading = ref(0);

const onSubmit = () => {
  loading.value += 1;
  emit('apply', name);
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
    v-model:show="show"
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
