<script setup lang="ts">
import { DEVICE_FILES, useFileSystem } from '@entity/mountedDirectories';
import { useDisconnectDeviceDirectory } from '@feature/deviceDirectoryDisconnect';
import { usePickLocalDirectory } from '@feature/localDirectoryPick';
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
const { pickLocalDirectory } = usePickLocalDirectory();

const onClickAddLocalDirectory = async () => {
  await pickLocalDirectory();
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
          tooltip="disconnect local directory"
          md-symbol-name="link_off"
          @click="() => disconnectDeviceDirectory(deviceFile.name)"
        />
      </template>
    </MDListItem>

    <MDListItem
      is="button"
      headline="Add Local Directory"
      supporting-text="Pick a folder from this device to keep it available here"
      @click="onClickAddLocalDirectory"
    >
      <template #leadingIcon>
        <MDSymbol name="folder_open" />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
