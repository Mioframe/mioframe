<script setup lang="ts">
import { SnackbarContainer, useSnackbar } from '@shared/ui/Snackbar';
import { onErrorCaptured, useTemplateRef } from 'vue';
import DialogContainer from '@shared/ui/Dialog/Alert/DialogContainer.vue';
import { RouterView } from 'vue-router';
import { PerformanceOverlay } from '@shared/ui/performance';
import { useDialogContainer } from '@shared/ui/Dialog';
import { usePermanentStorageRequest } from '@feature/permanentStorageRequest';
import { useLocalSettings } from '@entity/localSettings';
import { provideOverlayContainer } from '@shared/ui/Overlay';

const { addSnackbar } = useSnackbar();

onErrorCaptured((error) => {
  addSnackbar({
    text: `Error: ${error.message}`,
  });
});

const overlayContainerEl = useTemplateRef('overlayContainerEl');

provideOverlayContainer(overlayContainerEl);

const { hasOpenedDialog } = useDialogContainer(overlayContainerEl);

const { permanentStorageRequest } = usePermanentStorageRequest();

void permanentStorageRequest();

const { settings } = useLocalSettings();
</script>

<template>
  <div class="main" :aria-hidden="hasOpenedDialog ? 'true' : 'false'">
    <RouterView />
  </div>

  <div ref="overlayContainerEl" />

  <DialogContainer />

  <SnackbarContainer />

  <PerformanceOverlay v-if="settings.showPerformance" />
</template>

<style lang="css" scoped>
.main {
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  overflow: auto;
}
</style>
