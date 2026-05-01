<script setup lang="ts">
import { LocalSettingsList } from '@entity/localSettings';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDPane } from '@shared/ui/Layout';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();
</script>

<template>
  <MDPane allow-bottom-navigation>
    <MDAppBar headline="Settings">
      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <LocalSettingsList />
  </MDPane>
</template>
