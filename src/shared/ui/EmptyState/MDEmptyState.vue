<script setup lang="ts">
defineProps<{
  headline: string;
  supportingText: string;
}>();

const slots = defineSlots<{
  actions: () => unknown;
  default: () => unknown;
  icon: () => unknown;
}>();
</script>

<template>
  <div class="md-empty-state">
    <div v-if="!!slots.icon" class="md-empty-state__icon">
      <slot name="icon" />
    </div>

    <div class="md-empty-state__headline">
      {{ headline }}
    </div>

    <div class="md-empty-state__supporting-text">
      {{ supportingText }}
    </div>

    <div v-if="!!slots.default" class="md-empty-state__body">
      <slot />
    </div>

    <div v-if="!!slots.actions" class="md-empty-state__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style lang="css" scoped>
.md-empty-state {
  box-sizing: border-box;
  padding: 24px;
  border-radius: 28px;
  flex-grow: 1;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  --md-container-color: var(--md-sys-color-surface-container-high);
  align-items: center;
  justify-content: center;

  &__icon {
    width: var(--md-symbol-size);
    height: var(--md-symbol-size);
    display: flex;
    justify-content: center;
    align-items: center;
    --md-content-color: : var(--md-sys-color-secondary);
    margin: 0 auto;
    --md-symbol-size: 42px;
  }

  &__headline {
    text-align: start;

    font-family: var(--md-sys-typescale-headline-small-font);
    line-height: var(--md-sys-typescale-headline-small-line-height);
    font-size: var(--md-sys-typescale-headline-small-size);
    font-weight: var(--md-sys-typescale-headline-small-weight);
    letter-spacing: var(--md-sys-typescale-headline-small-tracking);

    --md-content-color: var(--md-sys-color-on-surface);

    .md-dialog_has-icon & {
      text-align: center;
      margin-top: 16px;
    }
  }

  &__supporting-text {
    margin-top: 16px;
    text-align: center;

    font-family: var(--md-sys-typescale-body-medium-font);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    font-size: var(--md-sys-typescale-body-medium-size);
    font-weight: var(--md-sys-typescale-body-medium-weight);
    letter-spacing: var(--md-sys-typescale-body-medium-tracking);

    color: var(--md-sys-color-on-surface-variant);
  }

  &__body {
    margin-top: 12px;
    padding-top: 12px;
    gap: 16px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding-bottom: 4px;
  }

  &__actions {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
