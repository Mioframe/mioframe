<script setup lang="ts">
import { computed } from 'vue';
import { MDCard } from '@shared/ui/Card';
import { MDButton } from '@shared/ui/Button';
import { usePwaInstallAction } from '@feature/pwaInstall';

const { hasRetainedPrompt, runInstallAction, dismissHomeWidget } = usePwaInstallAction();

const primaryLabel = computed(() => (hasRetainedPrompt.value ? 'Install' : 'How to install'));

const onInstall = () => {
  void runInstallAction();
};

const onLater = () => {
  dismissHomeWidget();
};
</script>

<template>
  <MDCard class="pwa-install-widget" variant="outlined">
    <div class="pwa-install-widget__body">
      <h2 class="pwa-install-widget__headline">Install Mioframe</h2>
      <p class="pwa-install-widget__supporting-text">
        Add Mioframe to your home screen for quick access and a better experience.
      </p>
    </div>
    <div class="pwa-install-widget__actions">
      <MDButton :label="primaryLabel" color="filled" @click="onInstall" />
      <MDButton label="Later" color="text" @click="onLater" />
    </div>
  </MDCard>
</template>

<style lang="css" scoped>
.pwa-install-widget {
  &__body {
    display: flex;
    flex-direction: column;
    gap: 8dp;
  }

  &__headline {
    margin: 0;
    font-family: var(--md-sys-typescale-headline-small-font);
    font-size: var(--md-sys-typescale-headline-small-size);
    line-height: var(--md-sys-typescale-headline-small-line-height);
    letter-spacing: var(--md-sys-typescale-headline-small-tracking);
    font-weight: var(--md-sys-typescale-headline-small-weight);
  }

  &__supporting-text {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-medium-font);
    font-size: var(--md-sys-typescale-body-medium-size);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    letter-spacing: var(--md-sys-typescale-body-medium-tracking);
    font-weight: var(--md-sys-typescale-body-medium-weight);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8dp;
  }
}
</style>
