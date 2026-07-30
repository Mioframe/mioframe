<script setup lang="ts">
import { computed, ref } from 'vue';
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

const { status, mode, activeRelease, latestRelease, scheduledRelease, lastSuccessfulCheckAt } =
  useAppUpdate();
const { checkForUpdates, isChecking } = useAppUpdateCheck();
const { setMode, isChangingMode } = useAppUpdateModeChange();
const { installOnNextLaunch, isInstalling } = useAppUpdateInstallOnNextLaunch();
const { cancelScheduledUpdate, isCancelling } = useAppUpdateCancelScheduledUpdate();

/** Read once per failed-check re-render, not continuously reactive: only the online state at the moment of the current status matters. */
const isOnline = ref(typeof navigator === 'undefined' ? true : navigator.onLine);

const displayStatus = computed(() =>
  deriveAppUpdatesDisplayStatus({
    status: status.value,
    isChecking: isChecking.value,
    isPreparing: isInstalling.value,
    isOnline: isOnline.value,
  }),
);
const statusText = computed(() => getAppUpdatesDisplayStatusText(displayStatus.value));

const isBusy = computed(
  () => isChecking.value || isInstalling.value || isChangingMode.value || isCancelling.value,
);

const availableRelease = computed(() => scheduledRelease.value ?? latestRelease.value);
const availableVersion = computed(() => {
  const release = availableRelease.value;
  if (!release || release.releaseId === activeRelease.value?.releaseId) return undefined;
  return release.appVersion;
});

const showUpdateNow = computed(
  () => mode.value === 'manual' && displayStatus.value === 'update-available',
);
const showCancel = computed(() => mode.value === 'manual' && scheduledRelease.value !== undefined);
const isCheckDisabled = computed(
  () => isBusy.value || displayStatus.value === 'unavailable' || displayStatus.value === 'checking',
);
const isAutomaticToggleDisabled = computed(
  () => isBusy.value || displayStatus.value === 'unavailable',
);

const formattedLastCheck = computed(() =>
  lastSuccessfulCheckAt.value ? dayjs(lastSuccessfulCheckAt.value).format('lll') : undefined,
);
const formattedBuildDate = computed(() => dayjs(APP_BUILD_DATE).format('lll'));

const onUpdateNow = () => {
  void installOnNextLaunch();
};

const onCancel = () => {
  void cancelScheduledUpdate();
};

const onCheckForUpdates = () => {
  isOnline.value = typeof navigator === 'undefined' ? true : navigator.onLine;
  void checkForUpdates();
};

const onToggleAutomaticUpdates = () => {
  void setMode(mode.value === 'automatic' ? 'manual' : 'automatic');
};
</script>

<template>
  <div class="app-update-settings">
    <section class="app-update-settings__status" aria-live="polite">
      <h3 class="app-update-settings__status-headline">{{ statusText }}</h3>
      <p>Running version: {{ APP_VERSION }}</p>
      <p v-if="availableVersion">Available version: {{ availableVersion }}</p>
      <p v-if="displayStatus === 'ready'">
        Update ready. Close all Mioframe windows and reopen Mioframe to guarantee the update.
      </p>
    </section>

    <MDButton
      v-if="showUpdateNow"
      class="app-update-settings__update-now"
      label="Update now"
      :disabled="isBusy"
      @click="onUpdateNow"
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
