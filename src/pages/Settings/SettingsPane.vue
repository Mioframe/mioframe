<script setup lang="ts">
import { LocalSettingsList } from '@entity/localSettings';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDPane } from '@shared/ui/Layout';

defineSlots<{
  navigationButton: () => unknown;
}>();
</script>

<template>
  <MDPane>
    <MDAppBar>
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>
    </MDAppBar>

    <LocalSettingsList />
  </MDPane>
</template>
