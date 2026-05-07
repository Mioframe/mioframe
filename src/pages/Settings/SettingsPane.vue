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

const onOpenPrivacyHelp = async () => {
  await open('privacyHelp', {}, { target: 'settings' });
};
</script>

<template>
  <MDPane allow-bottom-navigation>
    <MDAppBar headline="Settings">
      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <SettingsSections @open-privacy-help="onOpenPrivacyHelp" />
  </MDPane>
</template>
