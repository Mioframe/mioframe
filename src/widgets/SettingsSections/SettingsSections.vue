<script setup lang="ts">
import { useLocalSettings } from '@entity/localSettings';
import { GOOGLE_DRIVE_INTEGRATION_AVAILABLE } from '@shared/config';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import SettingsSection from './SettingsSection.vue';
import SettingsCheckboxListItem from './SettingsCheckboxListItem.vue';

const emit = defineEmits<{
  openPrivacyHelp: [];
}>();

const { settings } = useLocalSettings();

const onToggleStarterExamples = () => {
  settings.value.hideStarterWidget = settings.value.hideStarterWidget === true ? undefined : true;
};

const onToggleGoogleDrive = () => {
  if (!GOOGLE_DRIVE_INTEGRATION_AVAILABLE) {
    return;
  }

  settings.value.googleDriveIntegrationEnabled =
    settings.value.googleDriveIntegrationEnabled === true ? undefined : true;
};

const onOpenPrivacyHelp = () => {
  emit('openPrivacyHelp');
};
</script>

<template>
  <div class="settings-sections">
    <SettingsSection title="Privacy & diagnostics">
      <MDListContainer is="div">
        <SettingsCheckboxListItem
          headline="Error diagnostics"
          supporting-text="Diagnostics are not available in this build."
          :checked="false"
          disabled
        />
      </MDListContainer>
    </SettingsSection>

    <SettingsSection title="Integrations">
      <MDListContainer is="div">
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
      </MDListContainer>
    </SettingsSection>

    <SettingsSection title="Home screen">
      <MDListContainer is="div">
        <SettingsCheckboxListItem
          headline="Starter examples"
          supporting-text="Show starter examples on the home screen."
          :checked="settings.hideStarterWidget !== true"
          @change="onToggleStarterExamples"
        />
      </MDListContainer>
    </SettingsSection>

    <SettingsSection title="Help">
      <MDListContainer is="div">
        <MDListItem
          is="button"
          type="button"
          headline="Data storage and privacy"
          @click="onOpenPrivacyHelp"
        >
          <template #supportingText>
            Learn where your data is stored and what can leave this device.
          </template>
        </MDListItem>
      </MDListContainer>
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
