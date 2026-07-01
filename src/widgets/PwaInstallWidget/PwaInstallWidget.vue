<script setup lang="ts">
import { computed } from 'vue';
import { usePwaInstallAction } from '@feature/pwaInstall';
import { MDCard } from '@shared/ui/Card';
import { MDButton } from '@shared/ui/Button';

const { hasRetainedPrompt, runInstallAction, dismissHomeWidget } = usePwaInstallAction();

const primaryLabel = computed(() => (hasRetainedPrompt.value ? 'Install' : 'How to install'));

const onInstall = () => {
  void runInstallAction();
};
</script>

<template>
  <MDCard
    class="pwa-install-widget"
    variant="outlined"
    role="region"
    aria-labelledby="pwa-install-widget-heading"
  >
    <div class="pwa-install-widget__body">
      <h2
        id="pwa-install-widget-heading"
        class="pwa-install-widget__headline md-typescale-title-small"
      >
        Install Mioframe
      </h2>
      <p class="pwa-install-widget__supporting-text md-typescale-body-medium">
        Add Mioframe to your home screen for quick access and a better experience.
      </p>
    </div>
    <div class="pwa-install-widget__actions">
      <MDButton :label="primaryLabel" color="filled" @click="onInstall" />
      <MDButton label="Later" color="text" @click="dismissHomeWidget" />
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
    color: var(--md-sys-color-on-surface-variant);
  }

  &__supporting-text {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8dp;
  }
}
</style>
