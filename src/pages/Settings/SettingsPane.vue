<script setup lang="ts">
import { LocalSettingsList } from '@entity/localSettings';
import { MDAppBar } from '@shared/ui/AppBar';
import { MDPaneContainer } from '@shared/ui/Layout';

defineSlots<{
  navigationButton: () => unknown;
}>();
</script>

<template>
  <MDPaneContainer>
    <MDAppBar>
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>
    </MDAppBar>

    <LocalSettingsList />
  </MDPaneContainer>
</template>
