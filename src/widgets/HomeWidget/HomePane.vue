<script setup lang="ts">
import { MDPaneContainer } from '@shared/ui/Layers';
import BrowserStorageWidget from '../BrowserStorage/BrowserStorageWidget.vue';
import GoogleDriveWidget from './GoogleDriveWidget.vue';
import { MDDivider } from '@shared/ui/Divider';
</script>

<template>
  <MDPaneContainer class="home-widget">
    <h2 class="md sys typescale title-medium">Google Drive</h2>

    <GoogleDriveWidget />

    <MDDivider />

    <h2 class="md sys typescale title-medium">Local Storage</h2>

    <BrowserStorageWidget />
  </MDPaneContainer>
</template>

<style lang="css" scoped>
.home-widget {
  padding: 8px;
}
</style>
