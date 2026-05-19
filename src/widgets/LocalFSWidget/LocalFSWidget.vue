<script setup lang="ts">
import { DEVICE_FILES, useFileSystem } from '@entity/mountedDirectories';
import { useDisconnectDeviceDirectory } from '@feature/deviceDirectoryDisconnect';
import { MioframeSpaceCreateListItem, MioframeSpaceOpenListItem } from '@feature/mioframeSpacePick';
import { MDListContainer } from '@shared/ui/Lists';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import LocalFSDeviceFileListItem from './LocalFSDeviceFileListItem.vue';

const emit = defineEmits<{
  clickPath: [path: string];
}>();

const { deviceFiles } = useFileSystem();
const { disconnectDeviceDirectory } = useDisconnectDeviceDirectory();

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
      :can-disconnect="deviceFile.canDisconnect"
      @click-path="onClickDeviceFile"
      @disconnect="onDisconnectDeviceFile"
    />

    <MioframeSpaceCreateListItem />
    <MioframeSpaceOpenListItem />
  </MDListContainer>
</template>
