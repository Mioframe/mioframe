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
      headline="Create space"
      supporting-text="Create or select a new folder. The folder name will be used as the space name."
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
      supporting-text="Select an existing Mioframe space folder."
      :disabled="loading"
      @click="openSpace"
    >
      <template #leadingIcon>
        <MDSymbol name="folder_open" />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
