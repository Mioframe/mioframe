<script setup lang="ts">
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { useLocalSettings } from './useLocalSettings';
import { MDCheckbox } from '@shared/ui/Checkbox';
import { GOOGLE_DRIVE_INTEGRATION_AVAILABLE } from '@shared/config';

const { settings, SETTINGS_DESCRIPTION, SETTINGS_LABEL } = useLocalSettings();
const unavailableGoogleDriveDescription = 'Google Drive integration is not configured';

const onClickHideStarterWidget = () => {
  settings.value.hideStarterWidget = !settings.value.hideStarterWidget;
};

const onClickShowPerformance = () => {
  settings.value.showPerformance = !settings.value.showPerformance;
};

const onClickShowAutomergeFiles = () => {
  settings.value.showAutomergeFiles = !settings.value.showAutomergeFiles;
};

const onClickGoogleDriveIntegrationEnabled = () => {
  if (!GOOGLE_DRIVE_INTEGRATION_AVAILABLE) {
    return;
  }

  settings.value.googleDriveIntegrationEnabled = !settings.value.googleDriveIntegrationEnabled;
};
</script>

<template>
  <MDListContainer is="div" class="local-settings">
    <MDListItem
      is="button"
      :headline="SETTINGS_LABEL.hideStarterWidget"
      @click="onClickHideStarterWidget"
    >
      <template #supportingText>
        {{ SETTINGS_DESCRIPTION.hideStarterWidget }}
      </template>

      <template #trailingIcon>
        <MDCheckbox v-model="settings.hideStarterWidget" />
      </template>
    </MDListItem>

    <MDListItem
      is="button"
      :headline="SETTINGS_LABEL.showPerformance"
      @click="onClickShowPerformance"
    >
      <template #supportingText>
        {{ SETTINGS_DESCRIPTION.showPerformance }}
      </template>

      <template #trailingIcon>
        <MDCheckbox v-model="settings.showPerformance" />
      </template>
    </MDListItem>

    <MDListItem
      is="button"
      :headline="SETTINGS_LABEL.googleDriveIntegrationEnabled"
      @click="onClickGoogleDriveIntegrationEnabled"
    >
      <template #supportingText>
        {{
          GOOGLE_DRIVE_INTEGRATION_AVAILABLE
            ? SETTINGS_DESCRIPTION.googleDriveIntegrationEnabled
            : unavailableGoogleDriveDescription
        }}
      </template>

      <template #trailingIcon>
        <MDCheckbox
          :model-value="
            GOOGLE_DRIVE_INTEGRATION_AVAILABLE ? settings.googleDriveIntegrationEnabled : false
          "
          :disabled="!GOOGLE_DRIVE_INTEGRATION_AVAILABLE"
          readonly
        />
      </template>
    </MDListItem>

    <MDListItem
      is="button"
      :headline="SETTINGS_LABEL.showAutomergeFiles"
      @click="onClickShowAutomergeFiles"
    >
      <template #supportingText>
        {{ SETTINGS_DESCRIPTION.showAutomergeFiles }}
      </template>

      <template #trailingIcon>
        <MDCheckbox v-model="settings.showAutomergeFiles" />
      </template>
    </MDListItem>
  </MDListContainer>
</template>
