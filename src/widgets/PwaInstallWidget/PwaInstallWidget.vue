<script setup lang="ts">
import { usePwaInstallAction } from '@feature/pwaInstall';
import PwaInstallCard from './PwaInstallCard.vue';

const { hasRetainedPrompt, runInstallAction, dismissHomeWidget } = usePwaInstallAction();

const onInstall = () => {
  void runInstallAction();
};
</script>

<template>
  <PwaInstallCard
    class="pwa-install-widget"
    :has-retained-prompt="hasRetainedPrompt"
    @install="onInstall"
    @later="dismissHomeWidget"
  />
</template>
