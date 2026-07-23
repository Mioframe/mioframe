<script setup lang="ts">
import { SnackbarContainer, useSnackbar } from '@shared/ui/Snackbar';
import { onErrorCaptured, useTemplateRef } from 'vue';
import DialogContainer from '@shared/ui/Dialog/Alert/DialogContainer.vue';
import { RouterView } from 'vue-router';
import { PerformanceOverlay } from '@shared/ui/performance';
import { useLocalSettings } from '@entity/localSettings';
import { useVfsActivity } from '@entity/vfsActivity';
import { setupAppUpdateRestartReadiness } from '@shared/serviceClient/appUpdate';
import { provideOverlayContainer } from '@shared/ui/Overlay';
import { useMainContentAriaHidden } from '@shared/ui/AriaHidden';
import { useFocusIndicator } from '@shared/ui/State/useFocusIndicator';
import { setupMetaThemeColor } from '@shared/lib/metaThemeColor';
import { usePreventUnloadDuringActiveWrites } from '@feature/preventUnloadDuringActiveWrites';
import { useOptionalGoogleDriveIntegration } from '@feature/googleDriveIntegration';
import { useDiagnosticsReporting } from '@feature/diagnosticsReporting';
import { setupPwaInstallRuntime } from '@feature/pwaInstall';
import { useManualAppUpdateNotification } from '@feature/appUpdate';

const { addSnackbar } = useSnackbar();

onErrorCaptured((error) => {
  addSnackbar({
    text: `Error: ${error.message}`,
  });
});

const overlayContainerEl = useTemplateRef('overlayContainerEl');

provideOverlayContainer(overlayContainerEl);

const { settings } = useLocalSettings();
const { isActive: isVfsActive } = useVfsActivity();
setupAppUpdateRestartReadiness(() => !isVfsActive.value);

const mainAriaHidden = useMainContentAriaHidden();

useFocusIndicator();
usePreventUnloadDuringActiveWrites();
useDiagnosticsReporting();
useOptionalGoogleDriveIntegration();
useManualAppUpdateNotification();

setupMetaThemeColor();
setupPwaInstallRuntime();
</script>

<template>
  <div class="main" :aria-hidden="mainAriaHidden">
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
