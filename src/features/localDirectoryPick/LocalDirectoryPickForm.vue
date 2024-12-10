<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { usePickLocalDirectory } from './usePickLocalDirectory';
import { type LocalDirectory } from '../../shared/lib/localFileSystem';
import { type GDriveDirectory } from '../../shared/lib/googleDrive';
import {
  createDocumentFolder,
  type DocumentFolder,
} from '../../shared/lib/cfrDocument';
import FormLayout from '@shared/ui/FormLayout.vue';

const emit = defineEmits<{
  submit: [documentFolder: DocumentFolder];
  cancel: [];
}>();

const selectedLocalDirectory = shallowRef<LocalDirectory>();

const selectedGDriveDirectory = shallowRef<GDriveDirectory>();

const canUseLocalDirectory = computed(() => 'showDirectoryPicker' in window);

const { openLocalDirectoryPicker: showPicker } = usePickLocalDirectory();

const onClickSelectLocalDirectory = async () => {
  const fileSystemDirectoryHandle = await showPicker();
  selectedGDriveDirectory.value = undefined;
  selectedLocalDirectory.value = fileSystemDirectoryHandle;
};

const documentFolder = computed(() =>
  selectedGDriveDirectory.value
    ? createDocumentFolder(selectedGDriveDirectory.value)
    : selectedLocalDirectory.value
      ? createDocumentFolder(selectedLocalDirectory.value)
      : undefined,
);

const onSubmit = () => {
  if (documentFolder.value) {
    emit('submit', documentFolder.value); // todo: добавить валидацию
  }
};

const onClickCancel = () => {
  selectedLocalDirectory.value = undefined;
  selectedGDriveDirectory.value = undefined;
  emit('cancel');
};
</script>

<template>
  <FormLayout @submit="onSubmit">
    <button
      class="button"
      type="button"
      :disabled="!canUseLocalDirectory"
      :class="{
        'is-success': selectedLocalDirectory,
      }"
      @click="onClickSelectLocalDirectory"
    >
      <span class="icon"><i class="fa-solid fa-house-chimney" /></span>

      <span>select local directory</span>
    </button>

    <template #actions>
      <button class="button is-primary" type="submit">Apply</button>

      <button class="button" type="reset" @click="onClickCancel">Cancel</button>
    </template>
  </FormLayout>
</template>
