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

// Release-only browser test seam: attaches a second, fully separate worker RPC client (never a
// field on the production `mainBackgroundService`/`fileSystem` surface) that starts/finishes one
// real, tracked VFS mutation, observed through the same production `useVfsActivity` this app
// already uses, so the release e2e suite can prove `Update now` blocking against genuine activity
// tracking end to end without overriding `vfsReady` directly. The dynamic import behind this
// compile-time-constant condition lets the bundler drop it entirely from every real
// stable/branch/PR build.
if (__RELEASE_TEST_HOOKS__) {
  void Promise.all([
    import('@shared/service/useService'),
    import('@shared/service/fileSystem/releaseTestFileSystemWorkerService'),
    import('@shared/lib/wrapWorker/defineWorkerClient'),
  ]).then(
    ([
      { getWorker },
      { releaseTestFileSystemServiceId, setupReleaseTestFileSystemService },
      { defineWorkerClient },
    ]) => {
      const useReleaseTestFileSystemServiceClient = defineWorkerClient(
        getWorker,
        releaseTestFileSystemServiceId,
        setupReleaseTestFileSystemService,
      );
      const client = useReleaseTestFileSystemServiceClient();
      Reflect.set(window, '__MIOFRAME_RELEASE_TEST_VFS_ACTIVITY__', {
        start: () => client.startReleaseTestPendingWrite(),
        finish: () => client.finishReleaseTestPendingWrite(),
      });
    },
  );
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
