<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import {
  deriveAppUpdatesDisplayStatus,
  getAppUpdatesDisplayStatusText,
  useAppUpdate,
} from '@entity/appUpdate';
import { useAppUpdateCancelScheduledUpdate } from '@feature/appUpdateCancelScheduledUpdate';
import { useAppUpdateCheck } from '@feature/appUpdateCheck';
import { useAppUpdateInstallOnNextLaunch } from '@feature/appUpdateInstallOnNextLaunch';
import { useAppUpdateModeChange } from '@feature/appUpdateModeChange';
import { APP_BUILD_DATE, APP_BUILD_ID, APP_VERSION } from '@shared/config';
import { dayjs } from '@shared/lib/dayjs';
import { MDButton } from '@shared/ui/Button';
import { MDList, MDListItem } from '@shared/ui/Lists';
import { MDSwitch } from '@shared/ui/Switch';

type LastAppUpdateAction = 'check' | 'install' | 'mode' | 'cancel';

const { status, isCapabilityAvailable, mode, candidate, lastSuccessfulCheckAt } = useAppUpdate();
const { checkForUpdates, isChecking, outcome: checkOutcome } = useAppUpdateCheck();
const { setMode, isChangingMode, outcome: modeOutcome } = useAppUpdateModeChange();
const {
  installOnNextLaunch,
  isInstalling,
  outcome: installOutcome,
} = useAppUpdateInstallOnNextLaunch();
const {
  cancelScheduledUpdate,
  isCancelling,
  outcome: cancelOutcome,
} = useAppUpdateCancelScheduledUpdate();
const lastAppUpdateAction = ref<LastAppUpdateAction | undefined>();

/** Reflects live browser connectivity, kept current by `online`/`offline` listeners rather than only sampled when the user presses Check. */
const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine);

const handleOnline = () => {
  isOnline.value = true;
};
const handleOffline = () => {
  isOnline.value = false;
};

onMounted(() => {
  if (typeof window === 'undefined') return;
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);
});

onUnmounted(() => {
  if (typeof window === 'undefined') return;
  window.removeEventListener('online', handleOnline);
  window.removeEventListener('offline', handleOffline);
});

const displayStatus = computed(() =>
  deriveAppUpdatesDisplayStatus({
    status: status.value,
    isOnline: isOnline.value,
  }),
);
const statusText = computed(() => getAppUpdatesDisplayStatusText(displayStatus.value));

const isBusy = computed(
  () => isChecking.value || isInstalling.value || isChangingMode.value || isCancelling.value,
);

const availableVersion = computed(() => {
  if (!candidate.value || candidate.value.phase === 'activating') return undefined;
  return candidate.value.release.appVersion;
});
const activatingVersion = computed(() =>
  candidate.value?.phase === 'activating' ? candidate.value.release.appVersion : undefined,
);

const showInstallOnNextLaunch = computed(
  () => mode.value === 'manual' && displayStatus.value === 'update-available',
);
const showRetryUpdate = computed(
  () => mode.value === 'manual' && displayStatus.value === 'update-failed',
);
const showCancel = computed(() => mode.value === 'manual' && displayStatus.value === 'ready');
const isCheckDisabled = computed(
  () =>
    isBusy.value ||
    !isCapabilityAvailable.value ||
    status.value === 'ready' ||
    status.value === 'activating',
);
const isAutomaticToggleDisabled = computed(
  () => isBusy.value || !isCapabilityAvailable.value || mode.value === undefined,
);

const busyMessage = computed(() => {
  if (isChecking.value) return 'Checking for updates…';
  if (isInstalling.value) return 'Preparing update…';
  if (isChangingMode.value) return 'Changing update mode…';
  if (isCancelling.value) return 'Cancelling scheduled update…';
  return undefined;
});

const latestActionOutcome = computed(() => {
  switch (lastAppUpdateAction.value) {
    case 'check':
      return checkOutcome.value;
    case 'install':
      return installOutcome.value;
    case 'mode':
      return modeOutcome.value;
    case 'cancel':
      return cancelOutcome.value;
    case undefined:
      return undefined;
  }
  return undefined;
});

const timeoutMessage = computed(() => {
  if (latestActionOutcome.value !== 'timeout') return undefined;
  switch (lastAppUpdateAction.value) {
    case 'check':
      return 'The update check timed out. It may still finish in the background.';
    case 'install':
      return 'Preparing the update timed out. It may still finish in the background.';
    case 'mode':
      return 'Changing update mode timed out. It may still finish in the background.';
    case 'cancel':
      return 'Cancelling the scheduled update timed out. It may still finish in the background.';
    case undefined:
      return undefined;
  }
  return undefined;
});

const formattedLastCheck = computed(() =>
  lastSuccessfulCheckAt.value ? dayjs(lastSuccessfulCheckAt.value).format('lll') : undefined,
);
const formattedBuildDate = computed(() => dayjs(APP_BUILD_DATE).format('lll'));

const onInstallOnNextLaunch = () => {
  lastAppUpdateAction.value = 'install';
  void installOnNextLaunch();
};

const onCancel = () => {
  lastAppUpdateAction.value = 'cancel';
  void cancelScheduledUpdate();
};

const onCheckForUpdates = () => {
  lastAppUpdateAction.value = 'check';
  void checkForUpdates();
};

const onToggleAutomaticUpdates = () => {
  if (mode.value === undefined) return;
  lastAppUpdateAction.value = 'mode';
  void setMode(mode.value === 'automatic' ? 'manual' : 'automatic');
};
</script>

<template>
  <div class="app-update-settings">
    <section class="app-update-settings__status" aria-live="polite">
      <h3 class="app-update-settings__status-headline">{{ statusText }}</h3>
      <p>Running version: {{ APP_VERSION }}</p>
      <p v-if="availableVersion">Available version: {{ availableVersion }}</p>
      <p v-if="displayStatus === 'activating' && activatingVersion">
        Activating version: {{ activatingVersion }}
      </p>
      <p v-if="displayStatus === 'ready'">
        Update ready. Close all Mioframe windows and reopen Mioframe to guarantee the update.
      </p>
      <p v-if="displayStatus === 'activating'">
        Activating the update now. The status will update automatically when activation completes.
      </p>
    </section>

    <p v-if="busyMessage" class="app-update-settings__action-feedback" aria-live="polite">
      {{ busyMessage }}
    </p>
    <p v-if="timeoutMessage" class="app-update-settings__action-feedback" aria-live="polite">
      {{ timeoutMessage }}
    </p>

    <MDButton
      v-if="showInstallOnNextLaunch"
      class="app-update-settings__install-on-next-launch"
      label="Install on next launch"
      :disabled="isBusy"
      @click="onInstallOnNextLaunch"
    />

    <MDButton
      v-if="showRetryUpdate"
      class="app-update-settings__retry-update"
      label="Retry update"
      :disabled="isBusy"
      @click="onInstallOnNextLaunch"
    />

    <MDList tag="div">
      <MDListItem
        mode="single-action"
        role="switch"
        label-text="Automatic updates"
        supporting-text="Download and prepare newer releases automatically. Updates apply when Mioframe restarts. Close all Mioframe windows and reopen it to guarantee the update."
        :line-count="2"
        :aria-checked="mode === 'automatic'"
        :aria-disabled="isAutomaticToggleDisabled ? 'true' : undefined"
        :disabled="isAutomaticToggleDisabled"
        @action="onToggleAutomaticUpdates"
      >
        <template #trailing>
          <MDSwitch
            presentation
            :selected="mode === 'automatic'"
            :disabled="isAutomaticToggleDisabled"
          />
        </template>
      </MDListItem>

      <MDListItem
        mode="single-action"
        label-text="Check for updates"
        :disabled="isCheckDisabled"
        @action="onCheckForUpdates"
      />

      <MDListItem
        v-if="showCancel"
        mode="single-action"
        label-text="Cancel scheduled update"
        :disabled="isBusy"
        @action="onCancel"
      />
    </MDList>

    <p v-if="formattedLastCheck">Last checked: {{ formattedLastCheck }}</p>

    <section class="app-update-settings__build-details">
      <p v-if="APP_BUILD_ID">Build: {{ APP_BUILD_ID }}</p>
      <p>Build date: {{ formattedBuildDate }}</p>
    </section>
  </div>
</template>

<style scoped>
.app-update-settings {
  display: grid;
  gap: 16px;
}

.app-update-settings__status {
  display: grid;
  gap: 4px;
}

.app-update-settings__status-headline {
  font: var(--md-sys-typescale-title-medium-font);
  line-height: var(--md-sys-typescale-title-medium-line-height);
  font-size: var(--md-sys-typescale-title-medium-size);
  font-weight: var(--md-sys-typescale-title-medium-weight);
  letter-spacing: var(--md-sys-typescale-title-medium-tracking);
}

.app-update-settings__build-details {
  color: var(--md-sys-color-on-surface-variant);
}
</style>
