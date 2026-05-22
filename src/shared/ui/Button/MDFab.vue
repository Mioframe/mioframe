<script setup lang="ts">
import { computed, useTemplateRef } from 'vue';
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { MDPlainTooltip } from '../Tooltips';
import { MDStateLayer, useRipple, useStateLayer } from '../State';
import { MDSymbol } from '../Icon';

const props = withDefaults(
  defineProps<{
    size?: 'medium' | 'large' | undefined;
    color?:
      | 'primary'
      | 'secondary'
      | 'tertiary'
      | 'tonal-primary'
      | 'tonal-secondary'
      | 'tonal-tertiary'
      | undefined;
    tooltip: string;
    loading?: number | boolean | undefined;
    mdSymbol?: string | undefined;
  }>(),
  { color: 'primary' },
);

const emit = defineEmits<{
  click: [payload: MouseEvent];
}>();

defineSlots<{
  icon(): unknown;
}>();

const sizeClass = computed(() => {
  return props.size ? `md-fab_${props.size}` : undefined;
});

const typeClass = computed(() => {
  return `md-fab_${props.color}`;
});

const onFabClick = (event: MouseEvent) => {
  event.stopPropagation();
  emit('click', event);
};

const buttonEl = useTemplateRef<HTMLButtonElement>('buttonEl');
const { hover, focused, durationPressedState } = useStateLayer(buttonEl);

useRipple(buttonEl);
</script>

<template>
  <button
    ref="buttonEl"
    type="button"
    :aria-label="tooltip"
    class="md-fab"
    :class="[
      sizeClass,
      typeClass,
      {
        'md-state_hover': hover,
        'md-state_focused': focused,
        'md-state_pressed': durationPressedState,
      },
    ]"
    @click="onFabClick"
  >
    <MDStateLayer :hover="hover" :focused="focused" :pressed="durationPressedState" />

    <span class="md-fab__icon">
      <MDCircularProgressIndicator v-if="loading" />

      <slot v-else name="icon">
        <MDSymbol v-if="mdSymbol" :name="mdSymbol" />

        <span v-else class="empty-icon" />
      </slot>
    </span>

    <MDPlainTooltip :text="tooltip" />
  </button>
</template>

<style scoped>
.md-fab {
  --md-fab-icon-size: 24dp;
  --md-fab-container-size: 56dp;
  --md-fab-container-shape: var(--md-sys-shape-corner-large);
  --md-container-color: var(--md-fab-container-color);
  --md-content-color: var(--md-fab-icon-color);

  --md-state-box-shadow: var(--md-sys-elevation-level3);

  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: var(--md-fab-container-size);
  height: var(--md-fab-container-size);
  border: 0;
  border-radius: var(--md-fab-container-shape);
  background: var(--md-container-color);
  color: var(--md-content-color);
  box-shadow: var(--md-state-box-shadow);
  -webkit-tap-highlight-color: transparent;
  &_primary {
    --md-fab-container-color: var(--md-sys-color-primary);
    --md-fab-icon-color: var(--md-sys-color-on-primary);
  }

  &_secondary {
    --md-fab-container-color: var(--md-sys-color-secondary);
    --md-fab-icon-color: var(--md-sys-color-on-secondary);
  }

  &_tertiary {
    --md-fab-container-color: var(--md-sys-color-tertiary);
    --md-fab-icon-color: var(--md-sys-color-on-tertiary);
  }

  &_tonal-primary {
    --md-fab-container-color: var(--md-sys-color-primary-container);
    --md-fab-icon-color: var(--md-sys-color-on-primary-container);
  }

  &_tonal-secondary {
    --md-fab-container-color: var(--md-sys-color-secondary-container);
    --md-fab-icon-color: var(--md-sys-color-on-secondary-container);
  }

  &_tonal-tertiary {
    --md-fab-container-color: var(--md-sys-color-tertiary-container);
    --md-fab-icon-color: var(--md-sys-color-on-tertiary-container);
  }

  &:hover {
    --md-state-box-shadow: var(--md-sys-elevation-level4);
  }

  &__icon {
    position: relative;
    z-index: 1;
    display: inline-flex;
    width: var(--md-fab-icon-size);
    height: var(--md-fab-icon-size);
    columns: var(--md-fab-icon-color);
    justify-content: center;
    align-items: center;
  }

  &_medium {
    --md-fab-container-size: 80dp;
    --md-fab-icon-size: 28dp;
    --md-fab-container-shape: var(--md-sys-shape-corner-large-increased);
  }

  &_large {
    --md-fab-container-size: 96dp;
    --md-fab-icon-size: 36dp;
    --md-fab-container-shape: var(--md-sys-shape-corner-extra-large);
  }

  .empty-icon {
    box-sizing: border-box;
    border: 1px solid currentColor;
    background:
      linear-gradient(
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
