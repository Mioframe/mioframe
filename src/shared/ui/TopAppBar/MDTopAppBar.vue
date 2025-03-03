<script lang="ts" setup>
defineProps<{
  headline: string;
}>();

defineSlots<{
  leadingNavigation(): unknown;
  trailingInteractive(): unknown;
}>();

// todo: нужна логика для скролла шапки
</script>

<template>
  <div class="md-top-app-bar md-top-app-bar_on-scroll">
    <slot name="leadingNavigation" />

    <span class="md-top-app-bar__headline">
      {{ headline }}
    </span>

    <div
      v-if="!!$slots.trailingInteractive"
      class="md-top-app-bar__trailing-interactive"
    >
      <slot name="trailingInteractive" />
    </div>
  </div>
</template>

<style lang="css" scoped>
.md-top-app-bar {
  display: flex;
  /* --md-container-color: var(--md-sys-color-surface-container); */
  /* --md-content-color: var(--md-sys-color-on-surface); */
  min-height: 64px;
  padding: 0 16px;
  gap: 24px;
  align-items: center;

  &__headline {
    flex: 1;

    font-family: var(--md-sys-typescale-title-large-font);
    font-weight: var(--md-sys-typescale-title-large-weight);
    font-size: var(--md-sys-typescale-title-large-size);
    line-height: var(--md-sys-typescale-title-large-line-height);
    letter-spacing: var(--md-sys-typescale-title-large-tracking);
  }

  &__trailing-interactive {
    display: flex;
    gap: 8px;

    --md-content-color: var(--md-sys-color-on-surface-variant);
  }

  &_on-scroll {
    box-shadow: var(--md-sys-elevation-level2);
  }
}
</style>
