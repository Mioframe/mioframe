<script setup lang="ts">
import { useDiagnosticsSettings, useLocalSettings } from '@entity/localSettings';
import { PwaInstallSettingsListItem, usePwaInstallAction } from '@feature/pwaInstall';
import {
  GOOGLE_DRIVE_INTEGRATION_AVAILABLE,
  MANAGED_APP_UPDATES_AVAILABLE,
  SENTRY_DIAGNOSTICS_AVAILABLE,
} from '@shared/config';
import { MDList, MDListItem } from '@shared/ui/Lists';
import SettingsSection from './SettingsSection.vue';
import SettingsCheckboxListItem from './SettingsCheckboxListItem.vue';
import SettingsSwitchListItem from './SettingsSwitchListItem.vue';
import StorageSettingsSection from './StorageSettingsSection.vue';

const emit = defineEmits<{
  selectPrivacyPolicy: [];
  selectHelp: [];
  selectAboutMioframe: [];
  selectAppUpdates: [];
}>();

const { settings } = useLocalSettings();
const { diagnosticsEnabled, setDiagnosticsEnabledByUser } = useDiagnosticsSettings();
const { isSettingsEntryVisible } = usePwaInstallAction();

const onToggleStarterExamples = () => {
  settings.value.hideStarterWidget = settings.value.hideStarterWidget === true ? undefined : true;
};

const onToggleDiagnostics = () => {
  if (!SENTRY_DIAGNOSTICS_AVAILABLE) {
    return;
  }

  setDiagnosticsEnabledByUser(!diagnosticsEnabled.value);
};

const onToggleGoogleDrive = () => {
  if (!GOOGLE_DRIVE_INTEGRATION_AVAILABLE) {
    return;
  }

  settings.value.googleDriveIntegrationEnabled =
    settings.value.googleDriveIntegrationEnabled === true ? undefined : true;
};

const onClickPrivacyPolicy = () => {
  emit('selectPrivacyPolicy');
};

const onClickHelp = () => {
  emit('selectHelp');
};

const onClickAboutMioframe = () => {
  emit('selectAboutMioframe');
};

const onClickAppUpdates = () => {
  emit('selectAppUpdates');
};
</script>

<template>
  <div class="settings-sections">
    <StorageSettingsSection />

    <SettingsSection v-if="isSettingsEntryVisible || MANAGED_APP_UPDATES_AVAILABLE" title="App">
      <MDList tag="div">
        <PwaInstallSettingsListItem />
        <MDListItem
          v-if="MANAGED_APP_UPDATES_AVAILABLE"
          mode="single-action"
          label-text="App updates"
          supporting-text="Choose how Mioframe installs new versions."
          @action="onClickAppUpdates"
        />
      </MDList>
    </SettingsSection>

    <SettingsSection title="Privacy & diagnostics">
      <MDList tag="div">
        <SettingsSwitchListItem
          headline="Error diagnostics"
          :supporting-text="
            SENTRY_DIAGNOSTICS_AVAILABLE
              ? 'Send technical error reports after you enable diagnostics.'
              : 'Diagnostics are not available in this build.'
          "
          :lines="2"
          :checked="SENTRY_DIAGNOSTICS_AVAILABLE ? diagnosticsEnabled : false"
          :disabled="!SENTRY_DIAGNOSTICS_AVAILABLE"
          @change="onToggleDiagnostics"
        />
      </MDList>
    </SettingsSection>

    <SettingsSection title="Integrations">
      <MDList tag="div">
        <SettingsCheckboxListItem
          headline="Google Drive"
          :supporting-text="
            GOOGLE_DRIVE_INTEGRATION_AVAILABLE
              ? 'Connect Google Drive accounts to open files you choose.'
              : 'Google Drive is not available in this build.'
          "
          :checked="
            GOOGLE_DRIVE_INTEGRATION_AVAILABLE
              ? settings.googleDriveIntegrationEnabled === true
              : false
          "
          :disabled="!GOOGLE_DRIVE_INTEGRATION_AVAILABLE"
          @change="onToggleGoogleDrive"
        />
      </MDList>
    </SettingsSection>

    <SettingsSection title="Home screen">
      <MDList tag="div">
        <SettingsCheckboxListItem
          headline="Starter examples"
          supporting-text="Show starter examples on the home screen."
          :checked="settings.hideStarterWidget !== true"
          @change="onToggleStarterExamples"
        />
      </MDList>
    </SettingsSection>

    <SettingsSection title="Help">
      <MDList tag="div">
        <MDListItem mode="single-action" label-text="Privacy policy" @action="onClickPrivacyPolicy">
          <template #supportingText> Read how Mioframe handles privacy and diagnostics. </template>
        </MDListItem>

        <MDListItem mode="single-action" label-text="Help" @action="onClickHelp">
          <template #supportingText>
            Read data storage, backup, restore, and troubleshooting guides.
          </template>
        </MDListItem>

        <MDListItem mode="single-action" label-text="About Mioframe" @action="onClickAboutMioframe">
          <template #supportingText>Version and build information.</template>
        </MDListItem>
      </MDList>
    </SettingsSection>
  </div>
</template>

<style scoped>
.settings-sections {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 12px 0 24px;
}
</style>
