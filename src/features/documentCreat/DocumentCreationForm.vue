<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { DocumentApi, FolderApi } from '../../shared/lib/documentApi';

const props = defineProps<{
  folderApi: FolderApi;
}>();

const emit = defineEmits<{
  created: [documentApi: DocumentApi];
  cancel: [];
}>();

const stateName = ref<string>();

const onSubmitCreate = async () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }
  const newDocumentApi: DocumentApi = await props.folderApi.create({
    name: stateName.value,
    type: 'any',
  });

  emit('created', newDocumentApi);
};

const onResetCreate = () => {
  stateName.value = undefined;
  emit('cancel');
};

const autofocusElement = ref<HTMLElement>();

watchEffect(() => {
  autofocusElement.value?.focus();
});

const documentTypeOptions = ['any'];

const documentType = ref<string>(documentTypeOptions[0]);
</script>

<template>
  <form
    class="block-spacing is-flex is-flex-direction-column"
    @submit="onSubmitCreate"
    @reset="onResetCreate"
  >
    <div class="field">
      <label class="label">Name</label>

      <div class="control">
        <input
          ref="autofocusElement"
          v-model="stateName"
          name="name"
          class="input"
          type="text"
          placeholder="name of the new document"
          required
        />
      </div>
    </div>

    <div class="select">
      <select v-model="documentType">
        <option
          v-for="option in documentTypeOptions"
          :key="option"
          :value="option"
        >
          {{ option }}
        </option>
      </select>
    </div>

    <div class="field is-grouped">
      <div class="control">
        <button class="button is-link" type="submit">Create</button>
      </div>

      <div class="control">
        <button class="button is-link is-light" type="reset">Cancel</button>
      </div>
    </div>
  </form>
</template>
