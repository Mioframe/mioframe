<script
  setup
  lang="ts"
  generic="
    T extends {
      name: string;
      remove: () => unknown;
    }
  "
>
import { computed, ref } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';

const { entry } = defineProps<{
  entry: T;
}>();

const emit = defineEmits<{
  cancel: [];
  removed: [];
}>();

const loading = ref(0);

const onSubmit = async () => {
  loading.value += 1;
  try {
    await entry.remove();
    emit('removed');
  } finally {
    loading.value -= 1;
  }
};
const onClickCancel = () => {
  emit('cancel');
};

const headline = computed(() => `Remove "${entry.name}"?`);

const supportingText = computed(
  () => `Are you sure you want to remove "${entry.name}"?`,
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
