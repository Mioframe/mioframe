<script setup lang="ts">
import { MDPaneContainer } from '@shared/ui/Layers';
import BrowserStorageWidget from '../BrowserStorage/BrowserStorageWidget.vue';
</script>

<template>
  <MDPaneContainer class="home-widget">
    <BrowserStorageWidget />
  </MDPaneContainer>
</template>

<style lang="css" scoped>
.home-widget {
  padding: 8px;
}
</style>
