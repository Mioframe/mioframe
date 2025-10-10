<script lang="ts" setup>
defineProps<{
  headline?: string;
}>();

const slots = defineSlots<{
  default(): unknown;
  leadingButton(): unknown;
  trailingElements(): unknown;
}>();
</script>

<template>
  <div class="md md-app-bar md-app-bar_on-scroll">
    <slot name="leadingButton" />

    <div class="md-app-bar__body">
      <slot>
        <span v-if="headline" class="md-app-bar__headline">
          {{ headline }}
        </span>
      </slot>
    </div>

    <div v-if="!!slots.trailingElements" class="md-app-bar__trailing-elements">
      <slot name="trailingElements" />
    </div>
  </div>
</template>

<style lang="css" scoped>
.md-app-bar {
  display: flex;
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

  &__trailing-elements {
    display: flex;
    gap: 8px;

    --md-content-color: var(--md-sys-color-on-surface-variant);
  }
}
</style>
