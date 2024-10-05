<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { usePickDirectory } from './usePickDirectory';
import type { LocalDirectory } from '../../shared/lib/localFileSystem';
import { createLocalDirectory } from '../../shared/lib/localFileSystem';
import { getGDrive, createGDriveDirectory } from '../../shared/lib/googleDrive';
import type { GDriveDirectory } from '../../shared/lib/googleDrive';

const canUseLocalDirectory = computed(() => 'showDirectoryPicker' in global);

const { showPicker } = usePickDirectory();

const localDirectory = shallowRef<LocalDirectory>();

const onClickSelectLocalDirectory = async () => {
  const fileSystemDirectoryHandle = await showPicker();
  gDriveDirectory.value = undefined;
  localDirectory.value = createLocalDirectory(fileSystemDirectoryHandle);
};

const GDRIVE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const G_DIRECTORY_NAME = 'self base directory';

const canUseGDrive = computed(() => !!GDRIVE_CLIENT_ID);

const gDriveDirectory = shallowRef<GDriveDirectory>();

const onClickSelectGDrive = async () => {
  if (GDRIVE_CLIENT_ID) {
    const gDrive = await getGDrive(GDRIVE_CLIENT_ID, ['file']);
    if (gDrive) {
      const rootGDDirectory = createGDriveDirectory(gDrive, 'root', 'root');
      const gList = await rootGDDirectory.getList();

      let gDirectory = gList.get(G_DIRECTORY_NAME);

      if (!gDirectory || !('getList' in gDirectory)) {
        gDirectory = await rootGDDirectory.createDirectory(G_DIRECTORY_NAME);
      }

      localDirectory.value = undefined;
      gDriveDirectory.value = gDirectory;
    }
  }
};

// const documentFolder = computed(() =>
//   gDriveDirectory.value
//     ? createDocumentFolder(gDriveDirectory.value)
//     : localDirectory.value
//       ? createDocumentFolder(localDirectory.value)
//       : undefined,
// );
</script>

<template>
  <form @submit.prevent>
    <button
      class="button"
      type="button"
      :disabled="!canUseLocalDirectory"
      :class="{
        'is-success': localDirectory,
      }"
      @click="onClickSelectLocalDirectory"
    >
      <span class="icon"><i class="fa-solid fa-house-chimney" /></span>

      <span>select local directory</span>
    </button>

    <button
      class="button"
      type="button"
      :disabled="!canUseGDrive"
      :class="{
        'is-success': gDriveDirectory,
      }"
      @click="onClickSelectGDrive"
    >
      <span class="icon"><i class="fa-brands fa-google-drive" /></span>

      <span>select Google Drive</span>
    </button>
  </form>
</template>
