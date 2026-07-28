<script setup lang="ts">
import { computed } from 'vue';
import { useAppUpdate } from '@entity/appUpdate';
import { useAppUpdateCancelScheduledUpdate } from '@feature/appUpdateCancelScheduledUpdate';
import { useAppUpdateCheck } from '@feature/appUpdateCheck';
import { useAppUpdateInstallOnNextLaunch } from '@feature/appUpdateInstallOnNextLaunch';
import { useAppUpdateModeChange } from '@feature/appUpdateModeChange';
import { MDList, MDListItem } from '@shared/ui/Lists';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import SettingsSection from './SettingsSection.vue';
import SettingsSwitchListItem from './SettingsSwitchListItem.vue';

const { status, mode } = useAppUpdate();
const { checkForUpdates, isChecking } = useAppUpdateCheck();
const { setMode, isChangingMode } = useAppUpdateModeChange();
const { installOnNextLaunch, isInstalling } = useAppUpdateInstallOnNextLaunch();
const { cancelScheduledUpdate, isCancelling } = useAppUpdateCancelScheduledUpdate();

const isBusy = computed(
  () => isChecking.value || isInstalling.value || isCancelling.value || isChangingMode.value,
);

/** The current status, with in-flight download work shown as its own state. */
const displayStatus = computed(() => {
  if (isChecking.value || isInstalling.value) return 'downloading' as const;
  return status.value;
});

type PrimaryAction = 'check' | 'install' | 'cancel' | undefined;

const primaryAction = computed<PrimaryAction>(() => {
  switch (displayStatus.value) {
    case 'not-checked':
    case 'up-to-date':
    case 'check-failed':
    case 'install-failed':
      return 'check';
    case 'update-available':
    case 'rolled-back':
      return mode.value === 'manual' ? 'install' : undefined;
    case 'ready':
      return 'cancel';
    default:
      return undefined;
  }
});

const statusHeadline = computed(() => {
  switch (primaryAction.value) {
    case 'check':
      return 'Check for updates';
    case 'install':
      return 'Install on next launch';
    case 'cancel':
      return 'Cancel scheduled update';
    default:
      break;
  }
  switch (displayStatus.value) {
    case 'unavailable':
      return 'Updates unavailable';
    case 'update-available':
      return 'Update available';
    case 'rolled-back':
      return 'Update failed';
    case 'downloading':
      return 'Downloading update';
    default:
      return 'Check for updates';
  }
});

const statusSupportingText = computed(() => {
  switch (displayStatus.value) {
    case 'unavailable':
      return "Updates aren't available in this browser or build.";
    case 'not-checked':
      return "You haven't checked for updates yet.";
    case 'up-to-date':
      return "You're on the latest release.";
    case 'update-available':
      return mode.value === 'manual'
        ? 'A newer release is available.'
        : 'A newer release is being downloaded automatically.';
    case 'rolled-back':
      return mode.value === 'manual'
        ? 'The last update attempt failed to start and was rolled back. You can try again.'
        : 'The last update attempt failed to start and was rolled back.';
    case 'downloading':
      return 'Preparing the new release.';
    case 'ready':
      return 'Update ready\n\nClose all Mioframe windows to finish updating. Your current session will not be interrupted.';
    case 'install-failed':
      return 'Installation failed. You can try again.';
    case 'check-failed':
      return 'Update check failed. Try again later.';
    default:
      return '';
  }
});

const isStatusItemDisabled = computed(() => isBusy.value || !primaryAction.value);

const onStatusAction = () => {
  switch (primaryAction.value) {
    case 'check':
      void checkForUpdates();
      return;
    case 'install':
      void installOnNextLaunch();
      return;
    case 'cancel':
      void cancelScheduledUpdate();
      return;
    default:
  }
};

const onToggleAutomaticUpdates = () => {
  void setMode(mode.value === 'automatic' ? 'manual' : 'automatic');
};
</script>

<template>
  <SettingsSection title="Updates">
    <MDList tag="div">
      <MDListItem
        mode="single-action"
        :label-text="statusHeadline"
        :supporting-text="statusSupportingText"
        :line-count="3"
        :disabled="isStatusItemDisabled"
        @action="onStatusAction"
      >
        <template v-if="displayStatus === 'downloading'" #trailing>
          <MDCircularProgressIndicator :size="24" />
        </template>
      </MDListItem>

      <SettingsSwitchListItem
        headline="Automatic updates"
        supporting-text="Download and prepare newer releases automatically. They still only apply after every Mioframe window closes."
        :checked="mode === 'automatic'"
        :disabled="isBusy || displayStatus === 'unavailable'"
        :lines="2"
        @change="onToggleAutomaticUpdates"
      />
    </MDList>
  </SettingsSection>
</template>
