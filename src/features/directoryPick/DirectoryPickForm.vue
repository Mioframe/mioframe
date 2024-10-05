<script setup lang="ts">
import { computed, shallowRef } from 'vue';
import { usePickDirectory } from './usePickDirectory';
import {
  createLocalDirectory,
  type LocalDirectory,
} from '../../shared/lib/localFileSystem';
import {
  getGDrive,
  createGDriveDirectory,
  type GDriveDirectory,
} from '../../shared/lib/googleDrive';
import {
  createDocumentFolder,
  type DocumentFolder,
} from '../../shared/lib/cfrDocument';

const emit = defineEmits<{
  submit: [documentFolder: DocumentFolder];
  cancel: [];
}>();

const selectedLocalDirectory = shallowRef<LocalDirectory>();

const selectedGDriveDirectory = shallowRef<GDriveDirectory>();

const canUseLocalDirectory = computed(() => 'showDirectoryPicker' in window);

const { showPicker } = usePickDirectory();

const onClickSelectLocalDirectory = async () => {
  const fileSystemDirectoryHandle = await showPicker();
  selectedGDriveDirectory.value = undefined;
  selectedLocalDirectory.value = createLocalDirectory(
    fileSystemDirectoryHandle,
  );
};

const GDRIVE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const G_DIRECTORY_NAME = 'self base directory';

const canUseGDrive = computed(() => !!GDRIVE_CLIENT_ID);

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

      selectedLocalDirectory.value = undefined;
      selectedGDriveDirectory.value = gDirectory;
    }
  }
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
  <form
    class="is-flex is-flex-direction-column is-gap-2"
    @submit.prevent="onSubmit"
  >
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

    <button
      class="button"
      type="button"
      :disabled="!canUseGDrive"
      :class="{
        'is-success': selectedGDriveDirectory,
      }"
      @click="onClickSelectGDrive"
    >
      <span class="icon"><i class="fa-brands fa-google-drive" /></span>

      <span>select Google Drive</span>
    </button>

    <div class="field is-grouped">
      <button class="button is-primary" type="submit">Apply</button>

      <button class="button" type="reset" @click="onClickCancel">Cancel</button>
    </div>
  </form>
</template>
