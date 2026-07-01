<script setup lang="ts">
import { DEVICE_FILES, useFileSystem } from '@entity/mountedDirectories';
import { useDisconnectDeviceDirectory } from '@feature/deviceDirectoryDisconnect';
import { MioframeSpaceCreateListItem, MioframeSpaceOpenListItem } from '@feature/mioframeSpacePick';
import { MDList } from '@shared/ui/Lists';
import { MDCard } from '@shared/ui/Card';
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
  <MDCard class="local-fs-widget" variant="outlined">
    <h2 class="local-fs-widget__heading md-typescale-title-small">Device storage</h2>

    <MDList>
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
  </MDCard>
</template>

<style scoped>
.local-fs-widget {
  &__heading {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
