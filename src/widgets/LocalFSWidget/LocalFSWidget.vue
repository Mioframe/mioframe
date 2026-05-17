<script setup lang="ts">
import { DEVICE_FILES, useFileSystem } from '@entity/mountedDirectories';
import { useDisconnectDeviceDirectory } from '@feature/deviceDirectoryDisconnect';
import { MioframeSpacePickDialog, usePickMioframeSpace } from '@feature/mioframeSpacePick';
import { MDIconButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { OPFSName } from '@shared/service/directories';

const emit = defineEmits<{
  clickPath: [path: string];
}>();

const { deviceFiles } = useFileSystem();
const { disconnectDeviceDirectory } = useDisconnectDeviceDirectory();
const {
  dialogState,
  loading,
  openMioframeSpaceDialog,
  openCreateDialog,
  openExistingSpace,
  createNewSpace,
  chooseAnotherLocation,
  useSelectedFolder,
  createSubfolderFromSelectedFolder,
  closeDialog,
} = usePickMioframeSpace();

const onClickMioframeSpace = () => {
  openMioframeSpaceDialog();
};

const onClickDeviceFile = (name: string) => {
  emit('clickPath', PathUtils.join('/', DEVICE_FILES, name));
};

const isOpfsEntry = (name: string) => name === OPFSName;
</script>

<template>
  <MDListContainer is="div">
    <MDListItem
      is="button"
      v-for="deviceFile in deviceFiles ?? []"
      :key="deviceFile.name"
      :headline="deviceFile.name"
      :supporting-text="deviceFile.description"
      @click="() => onClickDeviceFile(deviceFile.name)"
    >
      <template #leadingIcon>
        <MDSymbol name="folder_managed" />
      </template>

      <template v-if="!isOpfsEntry(deviceFile.name)" #trailingIcon>
        <MDIconButton
          tooltip="Disconnect Mioframe space"
          md-symbol-name="link_off"
          @click="() => disconnectDeviceDirectory(deviceFile.name)"
        />
      </template>
    </MDListItem>

    <MDListItem
      is="button"
      headline="Create or open Mioframe space"
      supporting-text="Choose a folder for Mioframe documents and service files"
      @click="onClickMioframeSpace"
    >
      <template #leadingIcon>
        <MDSymbol name="folder_open" />
      </template>
    </MDListItem>

    <MioframeSpacePickDialog
      v-if="dialogState"
      :state="dialogState"
      :loading="loading"
      @close="closeDialog"
      @create="openCreateDialog"
      @open-existing="openExistingSpace"
      @create-new-space="createNewSpace"
      @choose-another-location="chooseAnotherLocation"
      @use-selected-folder="useSelectedFolder"
      @create-subfolder="createSubfolderFromSelectedFolder"
    />
  </MDListContainer>
</template>
