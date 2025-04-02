<script setup lang="ts">
import { MainView } from '@widget/MainViewV2';
import NotificationList from '../shared/ui/Notifications/NotificationList.vue';
import TooltipContainer from '@shared/ui/Tooltips/TooltipContainer.vue';
import { SnackbarContainer } from '@shared/ui/Snackbar';
</script>

<template>
  <div class="main">
    <MainView />
  </div>

  <NotificationList />

  <SnackbarContainer />

  <TooltipContainer />
</template>

<style lang="css" scoped>
.main {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  overflow: auto;
}
</style>
