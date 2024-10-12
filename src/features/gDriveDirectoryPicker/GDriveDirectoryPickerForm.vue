<script setup lang="ts">
import { shallowRef } from 'vue';
import type { GDriveFile, GDriveSpaces } from '../../shared/lib/googleDrive';
import { getGDrive, type GDriveDirectory } from '../../shared/lib/googleDrive';
import { GDriveDirectoryList } from '../../entities/gDrive';
import { createGDriveSpaces } from '../../shared/lib/googleDrive/createGDriveSpaces';

const emit = defineEmits<{
  submit: [directory: GDriveDirectory];
  cancel: [];
}>();

const selectedGDriveDirectory = shallowRef<GDriveDirectory>();

const onSubmit = () => {
  if (selectedGDriveDirectory.value) {
    emit('submit', selectedGDriveDirectory.value);
  }
};

const onClickCancel = () => {
  emit('cancel');
};

const rootGDriveDirectory = shallowRef<GDriveDirectory | GDriveSpaces>();

const fetchRootDirectiry = async () => {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  if (clientId) {
    const gDrive = await getGDrive(clientId, ['all']);

    if (gDrive) {
      rootGDriveDirectory.value = createGDriveSpaces(gDrive);
    }
  }
};

void fetchRootDirectiry();

const onClickList = (_key: string, item: GDriveDirectory | GDriveFile) => {
  if ('get' in item && item.getName() !== 'root') {
    selectedGDriveDirectory.value = item;
  }
};

const filterFolders = ([, item]: [string, GDriveDirectory | GDriveFile]) =>
  'get' in item;

// todo: добавить фичу создания директории
</script>

<template>
  <form
    class="is-flex is-flex-direction-column is-gap-2 is-overflow-auto"
    @submit.prevent="onSubmit"
  >
    <GDriveDirectoryList
      v-if="rootGDriveDirectory"
      :g-drive-directory="rootGDriveDirectory"
      :active-item="selectedGDriveDirectory"
      :filter="filterFolders"
      @click="onClickList"
    />

    <div class="field is-grouped">
      <button
        class="button is-primary"
        type="submit"
        :disabled="!selectedGDriveDirectory"
      >
        Apply
      </button>

      <button class="button" type="reset" @click="onClickCancel">Cancel</button>
    </div>
  </form>
</template>
