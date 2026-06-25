<script setup lang="ts">
import { computed } from 'vue';
import { MDListItem } from '@shared/ui/Lists';
import { usePwaInstallAction } from './usePwaInstallAction';

const { hasRetainedPrompt, runInstallAction } = usePwaInstallAction();

const actionLabel = computed(() => (hasRetainedPrompt.value ? 'Install' : 'How to install'));

const onClickInstall = () => {
  void runInstallAction();
};
</script>

<template>
  <MDListItem
    mode="single-action"
    class="pwa-install-settings-list-item"
    label-text="Install app"
    @action="onClickInstall"
  >
    <template #supportingText>{{ actionLabel }}</template>
  </MDListItem>
</template>
