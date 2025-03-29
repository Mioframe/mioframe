<script setup lang="ts">
import { MainView } from '@widget/MainViewV2';
import NotificationList from '../shared/ui/Notifications/NotificationList.vue';
</script>

<template>
  <div class="main">
    <MainView />
  </div>

  <NotificationList />
</template>

<style lang="css" scoped>
.main {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  overflow: auto;
}
</style>
