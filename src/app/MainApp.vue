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
import { useManualAppUpdateNotification } from '@feature/appUpdateNotify';

const { addSnackbar } = useSnackbar();

onErrorCaptured((error) => {
  addSnackbar({
    text: `Error: ${error.message}`,
  });
});

const overlayContainerEl = useTemplateRef('overlayContainerEl');

provideOverlayContainer(overlayContainerEl);

const { settings } = useLocalSettings();
const vfsActivity = useVfsActivity();
setupAppUpdateRestartReadiness(() => !vfsActivity.isActive.value);

// Release-only browser test seam: exposes a way to start/finish one real, tracked VFS operation
// so the release e2e suite can prove `Update now` blocking against genuine activity tracking
// end to end, without overriding `vfsReady` directly. Never present outside a release-test build.
if (
  __RELEASE_TEST_HOOKS__ &&
  vfsActivity.startReleaseTestPendingOperation &&
  vfsActivity.finishReleaseTestPendingOperation
) {
  Reflect.set(window, '__MIOFRAME_RELEASE_TEST_VFS_ACTIVITY__', {
    start: () => vfsActivity.startReleaseTestPendingOperation?.(),
    finish: (token: string) => vfsActivity.finishReleaseTestPendingOperation?.(token),
  });
}

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
