<script setup lang="ts">
import { RouterView } from 'vue-router';
import NotificationList from '../shared/ui/Notifications/NotificationList.vue';
</script>

<template>
  <div class="is-flex is-flex-grow-1 is-flex-direction-column is-overflow-auto">
    <RouterView />
  </div>

  <NotificationList />
</template>
