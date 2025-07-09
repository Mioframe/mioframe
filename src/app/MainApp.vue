<script setup lang="ts">
import NotificationList from '../shared/ui/Notifications/NotificationList.vue';
import TooltipContainer from '@shared/ui/Tooltips/TooltipContainer.vue';
import { SnackbarContainer, useSnackbar } from '@shared/ui/Snackbar';
import { onErrorCaptured } from 'vue';
import DialogContainer from '@shared/ui/Dialog/Alert/DialogContainer.vue';
import { RouterView } from 'vue-router';
import { PerformanceOverlay } from '@shared/ui/performance';

const { addSnackbar } = useSnackbar();

onErrorCaptured((error) => {
  addSnackbar({
    text: `Error: ${error.message}`,
  });
});
</script>

<template>
  <div class="main">
    <RouterView />
  </div>

  <DialogContainer />

  <NotificationList />

  <SnackbarContainer />

  <TooltipContainer />

  <PerformanceOverlay />
</template>

<style lang="css" scoped>
.main {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  overflow: auto;
}
</style>
