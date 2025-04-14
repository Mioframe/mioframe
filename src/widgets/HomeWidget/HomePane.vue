<script setup lang="ts">
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { MDPaneContainer } from '@shared/ui/Layers';
import GoogleDriveWidget from './GoogleDriveWidget.vue';
import { MDDivider } from '@shared/ui/Divider';
import LocalStorageWidget from './LocalStorageWidget.vue';

const emit = defineEmits<{
  openDirectory: [directory: DirectoryFSEntry];
}>();

const onOpenDirectory = (directory: DirectoryFSEntry) => {
  emit('openDirectory', directory);
};
</script>

<template>
  <MDPaneContainer class="home-widget">
    <h2 class="md sys typescale title-medium">Google Drive</h2>

    <GoogleDriveWidget @open-directory="onOpenDirectory" />

    <MDDivider />

    <h2 class="md sys typescale title-medium">Local Storage</h2>

    <LocalStorageWidget @open-directory="onOpenDirectory" />
  </MDPaneContainer>
</template>

<style lang="css" scoped>
.home-widget {
  padding: 8px;
}
</style>
