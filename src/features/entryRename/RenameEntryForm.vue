<script setup lang="ts">
import { isString } from 'lodash-es';
import { ref, watchEffect } from 'vue';
import type { DirectoryEntryRef, FileEntryRef } from '../../entities/entry';

const props = defineProps<{
  entry: DirectoryEntryRef | FileEntryRef;
}>();

const stateName = ref<string>();

watchEffect(() => {
  stateName.value = props.entry.label;
});

const emit = defineEmits<{
  renamed: [renamedEntry: DirectoryEntryRef | FileEntryRef];
  cancel: [];
}>();

const loading = ref(0);

const onSubmit = async () => {
  if (!loading.value) {
    loading.value += 1;
    try {
      if (isString(stateName.value)) {
        const renamedEntry = await props.entry.rename(stateName.value);
        emit('renamed', renamedEntry);
      }
    } finally {
      loading.value -= 1;
    }
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
    <div class="field">
      <label class="label">Name</label>

      <div class="control">
        <input
          v-model="stateName"
          class="input"
          type="text"
          placeholder="name"
        />
      </div>
    </div>

    <div class="field is-grouped">
      <div class="control">
        <button class="button" type="submit" :class="{ 'is-loading': loading }">
          Rename
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
