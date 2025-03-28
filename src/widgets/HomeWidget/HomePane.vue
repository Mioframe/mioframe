<script setup lang="ts">
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { MDPaneContainer } from '@shared/ui/Layers';
import GoogleDriveWidget from './GoogleDriveWidget.vue';
import { useModel } from 'vue';
import { MDDivider } from '@shared/ui/Divider';
import LocalStorageWidget from './LocalStorageWidget.vue';

const props = defineProps<{
  directoryPath: DirectoryFSEntry[];
}>();

// const emit = defineEmits<{
//   'update:directoryPath': [directoryPath: DirectoryFSEntry[]];
// }>();

const directoryPath = useModel(props, 'directoryPath');
</script>

<template>
  <MDPaneContainer class="home-widget">
    <h2 class="md sys typescale title-medium">Google Drive</h2>

    <GoogleDriveWidget v-model:directory-path="directoryPath" />

    <MDDivider />

    <h2 class="md sys typescale title-medium">Local Storage</h2>

    <LocalStorageWidget v-model:directory-path="directoryPath" />
  </MDPaneContainer>
</template>

<style lang="css" scoped>
.home-widget {
  padding: 8px;
}
</style>
