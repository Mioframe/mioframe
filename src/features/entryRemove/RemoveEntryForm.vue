<script setup lang="ts">
import { ref } from 'vue';
import type { EntryRef } from '../../entities/entry';
import FormLayout from '@shared/ui/FormLayout.vue';

const props = defineProps<{
  entry: EntryRef;
}>();

const emit = defineEmits<{
  cancel: [];
  removed: [];
}>();

const loading = ref(0);

const onSubmit = async () => {
  loading.value += 1;
  try {
    await props.entry.remove();
    emit('removed');
  } finally {
    loading.value -= 1;
  }
};
const onClickCancel = () => {
  emit('cancel');
};
</script>

<template>
  <FormLayout @submit="onSubmit">
    <p>Are you sure you want to remove "{{ props.entry.label }}"?</p>

    <template #actions>
      <button class="button" type="submit" :class="{ 'is-loading': loading }">
        Remove
      </button>

      <button
        class="button"
        type="button"
        :disabled="!!loading"
        @click="onClickCancel"
      >
        Cancel
      </button>
    </template>
  </FormLayout>
</template>
