<script setup lang="ts">
import { SnackbarContainer, useSnackbar } from '@shared/ui/Snackbar';
import { onErrorCaptured, useTemplateRef } from 'vue';
import DialogContainer from '@shared/ui/Dialog/Alert/DialogContainer.vue';
import { RouterView } from 'vue-router';
import { PerformanceOverlay } from '@shared/ui/performance';
import { useDialogContainer } from '@shared/ui/Dialog';

const { addSnackbar } = useSnackbar();

onErrorCaptured((error) => {
  addSnackbar({
    text: `Error: ${error.message}`,
  });
});

const dialogContainer = useTemplateRef('dialogContainer');

const { hasOpenedDialog } = useDialogContainer(dialogContainer);
</script>

<template>
  <div class="main" :aria-hidden="hasOpenedDialog ? 'true' : 'false'">
    <RouterView />
  </div>

  <div ref="dialogContainer" />

  <DialogContainer />

  <SnackbarContainer />

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
