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

const onSelectPrivacyPolicy = async () => {
  await open('dataStoragePrivacy', {}, { target: 'dataStoragePrivacy' });
};

const onSelectHelp = async () => {
  await open('helpIndex', {}, { target: 'helpIndex' });
};

const onSelectAboutMioframe = async () => {
  await open('aboutMioframe', {}, { target: 'aboutMioframe' });
};
</script>

<template>
  <MDPane allow-bottom-navigation>
    <template #topBar>
      <MDAppBar headline="Settings">
        <template #trailingElements>
          <slot name="appBarTrailing" />
        </template>
      </MDAppBar>
    </template>

    <SettingsSections
      @select-privacy-policy="onSelectPrivacyPolicy"
      @select-help="onSelectHelp"
      @select-about-mioframe="onSelectAboutMioframe"
    />
  </MDPane>
</template>
