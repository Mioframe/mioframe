<script setup lang="ts">
import NotificationList from '../shared/ui/Notifications/NotificationList.vue';
import { MainView } from '../widgets/MainView';
</script>

<template>
  <div class="is-flex is-flex-grow-1 is-flex-direction-column is-overflow-auto">
    <MainView />
  </div>

  <NotificationList />
</template>
