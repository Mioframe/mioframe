<script setup lang="ts">
import { computed } from 'vue';
import { vPressedState } from '@shared/lib/md/stateHelper';

const props = defineProps<{
  size?: 'small' | 'large';
  type?: 'primary' | 'branded' | 'secondary' | 'surface' | 'tertiary';
}>();

defineSlots<{
  icon(): unknown;
}>();

const sizeClass = computed(() => {
  return props.size ? `md-fab_${props.size}` : undefined;
});

const typeClass = computed(() => {
  return `md-fab_${props.type ?? 'primary'}`;
});
</script>

<template>
  <button
    v-pressed-state
    class="md-fab"
    :class="[sizeClass, typeClass]"
    type="button"
  >
    <span class="md-fab__icon">
      <slot name="icon">
        <div class="empty-icon" />
      </slot>
    </span>
  </button>
</template>

<style lang="scss" scoped>
@use '../../lib/md';

.md-fab {
  display: flex;
  justify-content: center;
  align-items: center;
  @include md.md-state;
  --md-fab-container-shape: var(--md-sys-shape-corner-large);
  --md-fab-icon-size: #{md.dp(24)};

  --md-container-color: var(--md-fab-container-color);
  --md-content-color: var(--md-fab-icon-color);
  width: md.dp(56);
  height: md.dp(56);
  border-radius: var(--md-fab-container-shape);
  @include md.elevateToShadow(3);

  &_primary {
    --md-fab-container-color: var(--md-sys-color-primary-container);
    --md-fab-icon-color: var(--md-sys-color-on-primary-container);
  }

  &_branded {
    --md-fab-container-color: var(--md-sys-color-surface-container-high);
    --md-fab-icon-color: var(--md-sys-color-surface-tint);
  }

  &_secondary {
    --md-fab-container-color: var(--md-sys-color-secondary-container);
    --md-fab-icon-color: var(--md-sys-color-on-secondary-container);
  }

  &_surface {
    --md-fab-container-color: var(--md-sys-color-surface-container-high);
    --md-fab-icon-color: var(--md-sys-color-surface-tint);
  }

  &_tertiary {
    --md-fab-container-color: var(--md-sys-color-tertiary-container);
    --md-fab-icon-color: var(--md-sys-color-on-tertiary-container);
  }

  &:hover {
    @include md.elevateToShadow(4);
  }

  &__icon {
    display: inline-flex;
    width: var(--md-fab-icon-size);
    height: var(--md-fab-icon-size);
    columns: var(--md-fab-icon-color);
    justify-content: center;
    align-items: center;
  }

  &_small {
    width: md.dp(40);
    height: md.dp(40);
    --md-fab-container-shape: var(--md-sys-shape-corner-medium);
  }

  &_large {
    width: md.dp(96);
    height: md.dp(96);
    --md-fab-icon-size: #{md.dp(36)};
    --md-fab-container-shape: var(--md-sys-shape-corner-extra-large);
  }

  .empty-icon {
    box-sizing: border-box;
    border: 1px solid currentColor;
    background: linear-gradient(
        45deg,
        currentColor 25%,
        transparent 25%,
        transparent 75%,
        currentColor 75%,
        currentColor
      ),
      linear-gradient(
        45deg,
        currentColor 25%,
        transparent 25%,
        transparent 75%,
        currentColor 75%,
        currentColor
      );
    background-position:
      0 0,
      5px 5px;
    background-size: 10px 10px;
    height: 100%;
    width: 100%;
  }
}
</style>
