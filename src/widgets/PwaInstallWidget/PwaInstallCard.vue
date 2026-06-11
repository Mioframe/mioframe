<script setup lang="ts">
import { computed } from 'vue';
import { MDCard } from '@shared/ui/Card';
import { MDButton } from '@shared/ui/Button';

const props = defineProps<{
  hasRetainedPrompt: boolean;
}>();

const emit = defineEmits<{
  install: [];
  later: [];
}>();

const primaryLabel = computed(() => (props.hasRetainedPrompt ? 'Install' : 'How to install'));

const onInstall = () => {
  emit('install');
};
const onLater = () => {
  emit('later');
};
</script>

<template>
  <MDCard class="pwa-install-card" variant="outlined">
    <div class="pwa-install-card__body">
      <h2 class="pwa-install-card__headline">Install Mioframe</h2>
      <p class="pwa-install-card__supporting-text">
        Add Mioframe to your home screen for quick access and a better experience.
      </p>
    </div>
    <div class="pwa-install-card__actions">
      <MDButton :label="primaryLabel" color="filled" @click="onInstall" />
      <MDButton label="Later" color="text" @click="onLater" />
    </div>
  </MDCard>
</template>

<style lang="css" scoped>
.pwa-install-card {
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
