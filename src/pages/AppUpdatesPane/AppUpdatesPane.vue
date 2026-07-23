<script setup lang="ts">
import { computed } from 'vue';
import { useAppUpdateActions } from '@feature/appUpdate';
import { dayjs } from '@shared/lib/dayjs';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDButton } from '@shared/ui/Button';
import { MDPane } from '@shared/ui/Layout';
import { SettingsSwitchListItem } from '@widget/SettingsSections';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const update = useAppUpdateActions();

const primaryStatus = computed(
  () =>
    ({
      notChecked: 'Not checked yet',
      checking: 'Checking for updates',
      upToDate: 'Up to date',
      available: 'Update available',
      preparing: 'Preparing update',
      ready: 'Update ready',
      checkFailed: 'Could not check for updates',
      prepareFailed: 'Could not prepare update',
      restartBlocked: 'Restart blocked',
      statusUnavailable: 'Status unavailable',
    })[update.status.value],
);

const operationExplanation = computed(() => {
  switch (update.errorCode.value) {
    case 'restartBusy':
      return 'Changes are still being saved in an open window. Try again when saving finishes.';
    case 'restartUnresponsive':
      return 'An open window did not confirm that it is ready to restart.';
    case 'checkFailed':
      return 'Mioframe could not confirm whether a newer version is available.';
    case 'prepareFailed':
      return 'The new version could not be downloaded and verified. Your current version is unchanged.';
    case 'capabilityUnavailable':
    case 'invalidResponse':
    case 'unsupportedProtocol':
      return 'Update controls are not available in this browser session.';
    default:
      return undefined;
  }
});

const isAutomatic = computed(() => update.state.value?.mode === 'automatic');
const showUpdateNow = computed(
  () => update.hasUpdate.value && update.operation.value === undefined,
);
const isActionPending = computed(() => update.operation.value !== undefined);
const lastChecked = computed(() => {
  const value = update.state.value?.lastSuccessfulCheckAt;
  return value ? dayjs(value).format('lll') : undefined;
});
const buildDate = computed(() => {
  const value = update.runningRelease.value?.buildDate;
  return value ? dayjs(value).format('lll') : undefined;
});

const onToggleAutomatic = () => {
  void update.setAutomatic(!isAutomatic.value);
};

const onCheckForUpdates = () => {
  void update.checkForUpdates();
};

const onUpdateNow = () => {
  void update.updateNow();
};
</script>

<template>
  <MDPane class="app-updates-pane" allow-bottom-navigation>
    <template #topBar>
      <MDAppBar headline="App updates">
        <template #leadingButton>
          <slot name="navigationButton" />
        </template>
        <template #trailingElements>
          <slot name="appBarTrailing" />
        </template>
      </MDAppBar>
    </template>

    <div class="app-updates-pane__content">
      <section class="app-updates-pane__status" aria-live="polite" aria-atomic="true">
        <h2 class="app-updates-pane__headline">{{ primaryStatus }}</h2>
        <p v-if="update.runningRelease.value">
          Current version: {{ update.runningRelease.value.appVersion }}
        </p>
        <p v-if="update.latestRelease.value">
          Latest confirmed version: {{ update.latestRelease.value.appVersion }}
        </p>
        <p v-if="operationExplanation">{{ operationExplanation }}</p>
      </section>

      <MDButton
        v-if="showUpdateNow"
        label="Update now"
        :loading="isActionPending"
        @click="onUpdateNow"
      />

      <SettingsSwitchListItem
        headline="Automatic updates"
        supporting-text="Prepare new versions automatically and use them on a safe later launch."
        :checked="isAutomatic"
        :disabled="isActionPending || !update.state.value"
        :lines="2"
        @change="onToggleAutomatic"
      />

      <MDButton
        color="outlined"
        label="Check for updates"
        :disabled="isActionPending || !update.state.value"
        @click="onCheckForUpdates"
      />

      <dl class="app-updates-pane__details">
        <template v-if="lastChecked">
          <dt>Last checked</dt>
          <dd>{{ lastChecked }}</dd>
        </template>
        <template v-if="update.runningRelease.value">
          <dt>Build</dt>
          <dd>{{ update.runningRelease.value.buildId }}</dd>
        </template>
        <template v-if="buildDate">
          <dt>Build date</dt>
          <dd>{{ buildDate }}</dd>
        </template>
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
