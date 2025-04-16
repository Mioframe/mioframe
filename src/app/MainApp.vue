<script setup lang="ts">
import { MainView } from '@widget/MainViewV2';
import NotificationList from '../shared/ui/Notifications/NotificationList.vue';
import TooltipContainer from '@shared/ui/Tooltips/TooltipContainer.vue';
import { SnackbarContainer, useSnackbar } from '@shared/ui/Snackbar';
import { onErrorCaptured } from 'vue';
import AlertContainer from '@shared/ui/Dialog/Alert/AlertContainer.vue';

const { addSnackbar } = useSnackbar();

onErrorCaptured((error) => {
  addSnackbar({
    text: `Error: ${error.message}`,
  });
});
</script>

<template>
  <div class="main">
    <MainView />
  </div>

  <AlertContainer />

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
