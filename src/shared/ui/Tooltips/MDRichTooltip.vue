<script setup lang="ts">
import { MD_SYS_TYPESCALE } from '@shared/lib/md';

const { subhead } = defineProps<{
  subhead: string;
}>();

const slots = defineSlots<{
  text(): unknown;
  actions(): unknown;
}>();
</script>

<template>
  <div class="md-rich-tooltip">
    <div class="md-rich-tooltip__subhead" :class="MD_SYS_TYPESCALE.title.small">
      {{ subhead }}
    </div>

    <div
      class="md-rich-tooltip__supporting-text"
      :class="MD_SYS_TYPESCALE.body.medium"
    >
      <slot name="text" />
    </div>

    <div v-if="!!slots.actions" class="md-rich-tooltip__actions">
      <slot name="actions" />
    </div>
  </div>
</template>

<style lang="css" scoped>
.md-rich-tooltip {
  --md-container-color: var(--md-sys-color-surface-container);
  background-color: var(--md-container-color);
  box-shadow: var(--md-sys-elevation-level2);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 12px 16px 8px;

  &__subhead {
    --md-content-color: var(--md-sys-color-on-surface-variant);
  }

  &__supporting-text {
    --md-content-color: var(--md-sys-color-on-surface-variant);
    margin-top: 4px;
  }

  &__actions {
    margin-top: 12px;
    display: flex;
    gap: 2step;
  }
}
</style>
