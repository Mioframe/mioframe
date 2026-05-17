<script setup lang="ts">
import { DEVICE_FILES, useFileSystem } from '@entity/mountedDirectories';
import { useDisconnectDeviceDirectory } from '@feature/deviceDirectoryDisconnect';
import { usePickMioframeSpace } from '@feature/mioframeSpacePick';
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
const { loading, createSpace, openSpace } = usePickMioframeSpace();

const onClickDeviceFile = (name: string) => {
  emit('clickPath', PathUtils.join('/', DEVICE_FILES, name));
};

const isOpfsEntry = (name: string) => name === OPFSName;

const getDeviceFileDescription = (name: string) =>
  isOpfsEntry(name)
    ? 'Saved directly in your browser on this device'
    : 'Mioframe space on this device';
</script>

<template>
  <MDListContainer is="div">
    <MDListItem
      is="button"
      v-for="deviceFile in deviceFiles ?? []"
      :key="deviceFile.name"
      :headline="deviceFile.name"
      :supporting-text="getDeviceFileDescription(deviceFile.name)"
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
      headline="Create space"
      supporting-text="Create or select a folder. Its name becomes the space name."
      multiline-supporting-text
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
      supporting-text="Select a folder that already contains Mioframe files."
      multiline-supporting-text
      :disabled="loading"
      @click="openSpace"
    >
      <template #leadingIcon>
        <MDSymbol name="folder_open" />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
