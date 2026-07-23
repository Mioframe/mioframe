<script setup lang="ts">
import { computed } from 'vue';
import { useAppUpdate } from '@entity/appUpdate';
import { useApplyAppUpdate } from '@feature/appUpdateApply';
import { useCheckForAppUpdates } from '@feature/appUpdateCheck';
import { useChangeAppUpdateMode } from '@feature/appUpdateModeChange';
import { dayjs } from '@shared/lib/dayjs';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDButton } from '@shared/ui/Button';
import { MDPane } from '@shared/ui/Layout';
import { SettingsSwitchListItem } from '@widget/SettingsSections';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { snapshot, hasUpdate } = useAppUpdate();
const checkAction = useCheckForAppUpdates();
const modeAction = useChangeAppUpdateMode();
const applyAction = useApplyAppUpdate();

const isAutomatic = computed(() => snapshot.value?.mode === 'automatic');
const isActionPending = computed(
  () => checkAction.pending.value || modeAction.pending.value || applyAction.pending.value,
);
const immediateErrorCode = computed(() => {
  const results = [checkAction.result.value, modeAction.result.value, applyAction.result.value];
  return results.find((result) => result !== undefined && result.status !== 'accepted')?.code;
});
const effectiveErrorCode = computed(() => immediateErrorCode.value ?? snapshot.value?.errorCode);
const primaryStatus = computed(() => {
  const value = snapshot.value;
  if (!value || value.capability === 'unavailable') return 'Status unavailable';
  if (
    effectiveErrorCode.value === 'blockedByActivity' ||
    effectiveErrorCode.value === 'blockedByOtherWindows'
  )
    return 'Update blocked';
  switch (value.updateState) {
    case 'notChecked':
      return 'Not checked yet';
    case 'checking':
      return 'Checking for updates';
    case 'preparing':
      return 'Preparing update';
    case 'trialStarting':
      return 'Starting update';
    case 'failed':
      return effectiveErrorCode.value === 'preparationFailed'
        ? 'Could not prepare update'
        : 'Could not check for updates';
    case 'ready':
      return 'Update ready';
    case 'available':
      return 'Update available';
    case 'upToDate':
    default:
      return 'Up to date';
  }
});
const operationExplanation = computed(() => {
  switch (effectiveErrorCode.value) {
    case 'blockedByActivity':
      return 'Changes are still being saved in an open window. Try again when saving finishes.';
    case 'blockedByOtherWindows':
      return 'Close other Mioframe windows to update.';
    case 'checkFailed':
    case 'invalidReleaseMetadata':
      return 'Mioframe could not confirm whether a newer version is available.';
    case 'preparationFailed':
      return 'The new version could not be downloaded and verified. Your current version is unchanged.';
    case 'capabilityUnavailable':
    case 'storageUnavailable':
      return 'Update controls are not available in this browser session.';
    default:
      return undefined;
  }
});
const modeExplanation = computed(() =>
  isAutomatic.value
    ? 'New versions are prepared automatically and used on a later safe launch.'
    : 'This version stays pinned until you choose Update now.',
);
const showUpdateNow = computed(() => hasUpdate.value);
const pinnedIsRelevant = computed(
  () =>
    snapshot.value?.mode === 'manual' &&
    snapshot.value.pinnedRelease !== undefined &&
    snapshot.value.pinnedRelease.releaseId !== snapshot.value.runningRelease?.releaseId,
);
const lastChecked = computed(() => {
  const value = snapshot.value?.lastSuccessfulCheckAt;
  return value ? dayjs(value).format('lll') : undefined;
});
const buildDate = computed(() => {
  const value = snapshot.value?.runningRelease?.buildDate;
  return value ? dayjs(value).format('lll') : undefined;
});

const onToggleAutomatic = () => {
  void modeAction.setMode(isAutomatic.value ? 'manual' : 'automatic');
};
const onCheckForUpdates = () => {
  void checkAction.checkForUpdates();
};
const onUpdateNow = () => {
  void applyAction.updateNow();
};
</script>

<template>
  <MDPane class="app-updates-pane" allow-bottom-navigation>
    <template #topBar>
      <MDAppBar headline="App updates">
        <template #leadingButton><slot name="navigationButton" /></template>
        <template #trailingElements><slot name="appBarTrailing" /></template>
      </MDAppBar>
    </template>

    <div class="app-updates-pane__content">
      <section class="app-updates-pane__status" aria-live="polite" aria-atomic="true">
        <h2 class="app-updates-pane__headline">{{ primaryStatus }}</h2>
        <p v-if="snapshot?.runningRelease">
          Current version: {{ snapshot.runningRelease.appVersion }}
        </p>
        <p v-if="pinnedIsRelevant">Pinned version: {{ snapshot?.pinnedRelease?.appVersion }}</p>
        <p v-if="snapshot?.latestRelease">
          Latest confirmed version: {{ snapshot.latestRelease.appVersion }}
        </p>
        <p>{{ modeExplanation }}</p>
        <p v-if="operationExplanation">{{ operationExplanation }}</p>
      </section>

      <MDButton
        v-if="showUpdateNow"
        label="Update now"
        :loading="applyAction.pending.value || snapshot?.updateState === 'preparing'"
        :disabled="isActionPending"
        @click="onUpdateNow"
      />

      <SettingsSwitchListItem
        headline="Automatic updates"
        :supporting-text="modeExplanation"
        :checked="isAutomatic"
        :disabled="isActionPending || snapshot?.capability !== 'available'"
        :lines="2"
        @change="onToggleAutomatic"
      />

      <MDButton
        color="outlined"
        label="Check for updates"
        :disabled="isActionPending || snapshot?.capability !== 'available'"
        @click="onCheckForUpdates"
      />

      <dl class="app-updates-pane__details">
        <template v-if="lastChecked"
          ><dt>Last checked</dt>
          <dd>{{ lastChecked }}</dd></template
        >
        <template v-if="snapshot?.runningRelease"
          ><dt>Build</dt>
          <dd>{{ snapshot.runningRelease.buildId }}</dd></template
        >
        <template v-if="buildDate"
          ><dt>Build date</dt>
          <dd>{{ buildDate }}</dd></template
        >
      </dl>
    </div>
  </MDPane>
</template>

<style scoped>
.app-updates-pane {
  --md-container-color: inherit;
  --md-content-color: inherit;
}
.app-updates-pane__content {
  display: grid;
  align-content: start;
  gap: 24px;
  padding: 16px;
}
.app-updates-pane__status,
.app-updates-pane__details {
  display: grid;
  gap: 8px;
  margin: 0;
}
.app-updates-pane__headline {
  margin: 0;
  font: var(--md-sys-typescale-headline-small-font);
}
.app-updates-pane__status p,
.app-updates-pane__details dd {
  margin: 0;
}
.app-updates-pane__details dt {
  font-weight: 500;
}
</style>
