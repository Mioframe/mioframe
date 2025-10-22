<script setup lang="ts">
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { useLocalSettings } from './model';
import { MDCheckbox } from '@shared/ui/Checkbox';

const { settings, SETTINGS_DESCRIPTION, SETTINGS_LABEL } = useLocalSettings();
</script>

<template>
  <MDListContainer is="div" class="local-settings">
    <MDListItem
      is="button"
      :headline="SETTINGS_LABEL.showPerformance"
      @click="settings.showPerformance = !settings.showPerformance"
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
      @click="settings.showAutomergeFiles = !settings.showAutomergeFiles"
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
