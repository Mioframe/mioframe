<script setup lang="ts">
import { DEVICE_FILES, useFileSystem } from '@entity/mountedDirectories';
import { useDisconnectDeviceDirectory } from '@feature/deviceDirectoryDisconnect';
import { MioframeSpaceCreateListItem, MioframeSpaceOpenListItem } from '@feature/mioframeSpacePick';
import { MDList } from '@shared/ui/Lists';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { OPFSName } from '@shared/service';
import LocalFSDeviceFileListItem from './LocalFSDeviceFileListItem.vue';
import BrowserStorageListItems from './BrowserStorageListItems.vue';

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
  <MDList list-style="segmented">
    <template v-for="deviceFile in deviceFiles ?? []" :key="deviceFile.name">
      <BrowserStorageListItems
        v-if="deviceFile.name === OPFSName"
        :name="deviceFile.name"
        :description="deviceFile.description"
        @click-path="onClickDeviceFile"
      />
      <LocalFSDeviceFileListItem
        v-else
        :name="deviceFile.name"
        :description="deviceFile.description"
        :can-disconnect="deviceFile.canDisconnect"
        @click-path="onClickDeviceFile"
        @disconnect="onDisconnectDeviceFile"
      />
    </template>

    <MioframeSpaceCreateListItem />
    <MioframeSpaceOpenListItem />
  </MDList>
</template>
