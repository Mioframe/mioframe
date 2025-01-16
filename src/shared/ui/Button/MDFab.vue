<script setup lang="ts">
import { computed } from 'vue';
import { vPressedState } from '@shared/lib/md/stateHelper';
import { vMdTooltip } from '../Tooltips';
import { MDCircularProgressIndicator } from '../ProgressIndicators';

const props = defineProps<{
  size?: 'small' | 'large';
  type?: 'primary' | 'branded' | 'secondary' | 'surface' | 'tertiary';
  tooltip: string;
  loading?: number | boolean;
}>();

defineSlots<{
  icon(): unknown;
}>();

defineEmits<{
  click: [payload: MouseEvent];
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
    v-md-tooltip="tooltip"
    class="md-fab md-state"
    :class="[sizeClass, typeClass]"
    type="button"
    @click="$emit('click', $event)"
  >
    <span class="md-fab__icon">
      <MDCircularProgressIndicator v-if="loading" />

      <slot v-else name="icon">
        <div class="empty-icon" />
      </slot>
    </span>
  </button>
</template>

<style scoped>
.md-fab {
  display: flex;
  justify-content: center;
  align-items: center;
  --md-fab-container-shape: var(--md-sys-shape-corner-large);
  --md-fab-icon-size: 24px;

  --md-container-color: var(--md-fab-container-color);
  --md-content-color: var(--md-fab-icon-color);
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: var(--md-fab-container-shape);
  box-shadow: var(--md-sys-elevation-level3);

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
    box-shadow: var(--md-sys-elevation-level4);
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
    width: 40px;
    height: 40px;
    --md-fab-container-shape: var(--md-sys-shape-corner-medium);
  }

  &_large {
    width: 96px;
    height: 96px;
    --md-fab-icon-size: 36px;
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
