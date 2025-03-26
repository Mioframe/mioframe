<script setup lang="ts">
import { RouterView } from 'vue-router';
import NotificationList from '../shared/ui/Notifications/NotificationList.vue';
</script>

<template>
  <div class="main">
    <RouterView />
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
