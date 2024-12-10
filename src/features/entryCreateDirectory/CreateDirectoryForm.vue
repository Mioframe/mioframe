<script setup lang="ts">
import { isUndefined } from 'lodash-es';
import { ref } from 'vue';
import type { LocalDirectoryRef } from '../../entities/entry';
import FormLayout from '@shared/ui/FormLayout.vue';

const props = defineProps<{
  parentEntry: LocalDirectoryRef;
}>();

const stateName = ref<string>();

const emit = defineEmits<{
  create: [createdDirectoryHandler: LocalDirectoryRef];
  cancel: [];
}>();

const loading = ref(0);

const onSubmit = async () => {
  if (!loading.value) {
    loading.value += 1;
    try {
      if (!isUndefined(stateName.value)) {
        const directoryEntry = await props.parentEntry.createDirectory(
          stateName.value,
        );
        emit('create', directoryEntry);
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
      <label class="label">Directory name</label>

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
        Create
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
