<script setup lang="ts">
import { MDAppBar } from '@shared/ui/AppBar';
import { MDPane } from '@shared/ui/Layout';
import { AppUpdateSettings } from '@widget/AppUpdateSettings';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();
</script>

<template>
  <MDPane class="app-updates-pane" allow-bottom-navigation>
    <template #topBar>
      <MDAppBar headline="App updates">
        <template #leadingButton>
          <slot name="navigationButton" />
        </template>

        <template #trailingElements>
          <slot name="appBarTrailing" />
        </template>
      </MDAppBar>
    </template>

    <div class="app-updates-pane__content">
      <AppUpdateSettings />
    </div>
  </MDPane>
</template>

<style scoped>
.app-updates-pane {
  --md-container-color: inherit;
  --md-content-color: inherit;
}

.app-updates-pane__content {
  padding: 16px;
}
</style>
