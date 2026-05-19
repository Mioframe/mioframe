<script setup lang="ts">
import { DEVICE_FILES, useFileSystem } from '@entity/mountedDirectories';
import { useDisconnectDeviceDirectory } from '@feature/deviceDirectoryDisconnect';
import { MioframeSpaceCreateDialog, usePickMioframeSpace } from '@feature/mioframeSpacePick';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import LocalFSDeviceFileListItem from './LocalFSDeviceFileListItem.vue';

const emit = defineEmits<{
  clickPath: [path: string];
}>();

const { deviceFiles } = useFileSystem();
const { disconnectDeviceDirectory } = useDisconnectDeviceDirectory();
const {
  loading,
  showCreateSpaceDialog,
  createSpaceName,
  createSpaceDialogError,
  createSpaceSelectedLocation,
  createSpaceResultFolder,
  createSpace,
  updateCreateSpaceName,
  submitCreateSpace,
  cancelCreateSpace,
  openSpace,
} = usePickMioframeSpace();

const onClickDeviceFile = (name: string) => {
  emit('clickPath', PathUtils.join('/', DEVICE_FILES, name));
};

const onDisconnectDeviceFile = (name: string) => {
  void disconnectDeviceDirectory(name);
};
</script>

<template>
  <MDListContainer is="div">
    <LocalFSDeviceFileListItem
      v-for="deviceFile in deviceFiles ?? []"
      :key="deviceFile.name"
      :name="deviceFile.name"
      :description="deviceFile.description"
      @click-path="onClickDeviceFile"
      @disconnect="onDisconnectDeviceFile"
    />

    <MDListItem
      is="button"
      headline="Create space"
      supporting-text="Choose where Mioframe should create a new folder for your documents."
      :lines="2"
      :disabled="loading"
      @click="createSpace"
    >
      <template #leadingIcon>
        <MDSymbol name="create_new_folder" />
      </template>
    </MDListItem>

    <MDListItem
      is="button"
      headline="Open space"
      supporting-text="Choose a folder that already contains a Mioframe space."
      :lines="2"
      :disabled="loading"
      @click="openSpace"
    >
      <template #leadingIcon>
        <MDSymbol name="folder_open" />
      </template>
    </MDListItem>
  </MDListContainer>

  <MioframeSpaceCreateDialog
    v-if="showCreateSpaceDialog"
    :model-value="createSpaceName"
    :error-text="createSpaceDialogError"
    :selected-location="createSpaceSelectedLocation"
    :result-folder="createSpaceResultFolder"
    :loading="loading"
    @update:model-value="updateCreateSpaceName"
    @apply="submitCreateSpace"
    @cancel="cancelCreateSpace"
  />
</template>
