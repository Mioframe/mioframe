<script setup lang="ts">
import { useDiagnosticsSettings, useLocalSettings } from '@entity/localSettings';
import { PwaInstallSettingsListItem, usePwaInstallAction } from '@feature/pwaInstall';
import { GOOGLE_DRIVE_INTEGRATION_AVAILABLE, SENTRY_DIAGNOSTICS_AVAILABLE } from '@shared/config';
import { MDList, MDListItem } from '@shared/ui/Lists';
import SettingsSection from './SettingsSection.vue';
import SettingsCheckboxListItem from './SettingsCheckboxListItem.vue';
import StorageSettingsSection from './StorageSettingsSection.vue';

const emit = defineEmits<{
  selectPrivacyPolicy: [];
  selectHelp: [];
  selectAboutMioframe: [];
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
</script>

<template>
  <div class="settings-sections">
    <StorageSettingsSection />

    <SettingsSection v-if="isSettingsEntryVisible" title="App">
      <MDList is="div">
        <PwaInstallSettingsListItem />
      </MDList>
    </SettingsSection>

    <SettingsSection title="Privacy & diagnostics">
      <MDList is="div">
        <SettingsCheckboxListItem
          headline="Error diagnostics"
          :supporting-text="
            SENTRY_DIAGNOSTICS_AVAILABLE
              ? 'Send technical error reports to help developers fix crashes and unexpected failures.'
              : 'Diagnostics are not available in this build.'
          "
          :checked="SENTRY_DIAGNOSTICS_AVAILABLE ? diagnosticsEnabled : false"
          :disabled="!SENTRY_DIAGNOSTICS_AVAILABLE"
          @change="onToggleDiagnostics"
        />
      </MDList>
    </SettingsSection>

    <SettingsSection title="Integrations">
      <MDList is="div">
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
      <MDList is="div">
        <SettingsCheckboxListItem
          headline="Starter examples"
          supporting-text="Show starter examples on the home screen."
          :checked="settings.hideStarterWidget !== true"
          @change="onToggleStarterExamples"
        />
      </MDList>
    </SettingsSection>

    <SettingsSection title="Help">
      <MDList is="div">
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
