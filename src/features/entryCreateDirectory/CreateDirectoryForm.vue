<script setup lang="ts">
import { isUndefined } from 'lodash-es';
import { ref } from 'vue';
import type { LocalDirectoryRef } from '../../entities/entry';

const props = defineProps<{
  parentEntry: LocalDirectoryRef;
}>();

const stateName = ref<string>();

const emit = defineEmits<{
  created: [createdDirectoryHandler: LocalDirectoryRef];
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
        emit('created', directoryEntry);
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

    <div class="field is-grouped">
      <div class="control">
        <button class="button" type="submit" :class="{ 'is-loading': loading }">
          Create
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
