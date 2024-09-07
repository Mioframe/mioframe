<script setup lang="ts">
import { ref } from 'vue';
import type { EntryRef } from '../../entities/entry';

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
  <form
    class="block-spacing is-flex is-flex-direction-column"
    @submit.prevent="onSubmit"
  >
    <p>Are you sure you want to remove "{{ props.entry.label }}"?</p>

    <div class="field is-grouped">
      <div class="control">
        <button class="button" type="submit" :class="{ 'is-loading': loading }">
          Remove
        </button>
      </div>

      <div class="control">
        <button
          class="button"
          type="button"
          :disabled="!!loading"
          @click="onClickCancel"
        >
          Cancel
        </button>
      </div>
    </div>
  </form>
</template>
