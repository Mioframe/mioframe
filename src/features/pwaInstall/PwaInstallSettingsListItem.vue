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
    is="button"
    class="pwa-install-settings-list-item"
    type="button"
    headline="Install app"
    @click="onClickInstall"
  >
    <template #supportingText>{{ actionLabel }}</template>
  </MDListItem>
</template>
