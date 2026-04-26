<script setup lang="ts">
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { useLocalSettings } from './useLocalSettings';
import { MDCheckbox } from '@shared/ui/Checkbox';

const { settings, SETTINGS_DESCRIPTION, SETTINGS_LABEL } = useLocalSettings();

const onClickHideStarterWidget = () => {
  settings.value.hideStarterWidget = !settings.value.hideStarterWidget;
};

const onClickShowPerformance = () => {
  settings.value.showPerformance = !settings.value.showPerformance;
};

const onClickShowAutomergeFiles = () => {
  settings.value.showAutomergeFiles = !settings.value.showAutomergeFiles;
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
