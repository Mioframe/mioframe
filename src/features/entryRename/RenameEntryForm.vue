<script setup lang="ts">
import { isString } from 'lodash-es';
import { ref, watchEffect } from 'vue';
import type { LocalDirectoryRef, LocalFileRef } from '../../entities/entry';
import FormLayout from '@shared/ui/FormLayout.vue';

const props = defineProps<{
  entry: LocalDirectoryRef | LocalFileRef;
}>();

const stateName = ref<string>();

watchEffect(() => {
  stateName.value = props.entry.label;
});

const emit = defineEmits<{
  renamed: [renamedEntry: LocalDirectoryRef | LocalFileRef];
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
  <FormLayout @submit="onSubmit">
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

    <template #actions>
      <button class="button" type="submit" :class="{ 'is-loading': loading }">
        Rename
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
