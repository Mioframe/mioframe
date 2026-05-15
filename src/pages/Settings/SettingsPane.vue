<script setup lang="ts">
import { useStackNavigation } from '@page/routes';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDPane } from '@shared/ui/Layout';
import { SettingsSections } from '@widget/SettingsSections';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { open } = useStackNavigation();

const onSelectDataStoragePrivacy = async () => {
  await open('dataStoragePrivacy', {}, { target: 'dataStoragePrivacy' });
};

const onSelectAboutMioframe = async () => {
  await open('aboutMioframe', {}, { target: 'aboutMioframe' });
};
</script>

<template>
  <MDPane allow-bottom-navigation>
    <MDAppBar headline="Settings">
      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <SettingsSections
      @select-data-storage-privacy="onSelectDataStoragePrivacy"
      @select-about-mioframe="onSelectAboutMioframe"
    />
  </MDPane>
</template>
