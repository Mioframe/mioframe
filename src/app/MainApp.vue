<script setup lang="ts">
import NotificationList from '../shared/ui/Notifications/NotificationList.vue';
import TooltipContainer from '@shared/ui/Tooltips/TooltipContainer.vue';
import { SnackbarContainer, useSnackbar } from '@shared/ui/Snackbar';
import { onErrorCaptured } from 'vue';
import DialogContainer from '@shared/ui/Dialog/Alert/DialogContainer.vue';
import { RouterView } from 'vue-router';
import { useIconStates } from '@shared/ui/Icon/useIconStates';
import { useHead } from '@unhead/vue';
import PerformanceOverlay from '@shared/ui/PerformanceOverlay.vue';

const { addSnackbar } = useSnackbar();

const { links } = useIconStates();

// useHead don't work in global state
useHead({
  link: links,
});

onErrorCaptured((error) => {
  addSnackbar({
    text: `Error: ${error.message}`,
  });
});

addSnackbar({
  text: `Version from ${new Date(__BUILD_DATE__).toLocaleString()}`,
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
