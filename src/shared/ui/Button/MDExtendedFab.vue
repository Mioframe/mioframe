<script setup lang="ts">
import { computed, useSlots, useTemplateRef } from 'vue';
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { MDPlainTooltip } from '../Tooltips';
import { MDStateLayer, useRipple, useStateLayer } from '../State';
import { MDSymbol } from '../Icon';

const props = withDefaults(
  defineProps<{
    /** Material Extended FAB size variant. */
    size?: 'small' | 'medium' | 'large' | undefined;
    /** Material Extended FAB color role. Tonal primary is the shared default for this surface. */
    color?:
      | 'primary'
      | 'secondary'
      | 'tertiary'
      | 'tonal-primary'
      | 'tonal-secondary'
      | 'tonal-tertiary'
      | undefined;
    /** Visible text label rendered inside the Extended FAB. */
    label: string;
    /** Optional tooltip text. When present, it is also used as the accessible name. */
    tooltip?: string | undefined;
    /**
     * Loading state for the action. `true` shows indeterminate progress; a number shows
     * determinate progress and keeps `0` visible as an active loading state.
     */
    loading?: number | boolean | undefined;
    /** Optional Material Symbols icon name used when no custom icon slot is provided. */
    mdSymbol?: string | undefined;
  }>(),
  {
    color: 'tonal-primary',
    size: 'small',
  },
);

const emit = defineEmits<{
  /** Emitted after native click handling is stopped from bubbling to parent action surfaces. */
  click: [payload: MouseEvent];
}>();

defineSlots<{
  /** Optional icon content rendered before the label when the component is not loading. */
  icon(): unknown;
}>();

const slots = useSlots();

const sizeClass = computed(() => `md-extended-fab_size_${props.size}`);
const typeClass = computed(() => `md-extended-fab_color_${props.color}`);
const hasLoading = computed(() => props.loading !== undefined && props.loading !== false);
const loadingProgress = computed(() =>
  typeof props.loading === 'number' ? props.loading : undefined,
);
const hasIconContent = computed(() => hasLoading.value || Boolean(props.mdSymbol || slots.icon));

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
    :aria-label="tooltip ?? label"
    class="md-extended-fab"
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

    <span v-if="hasIconContent" class="md-extended-fab__icon">
      <MDCircularProgressIndicator v-if="hasLoading" :progress="loadingProgress" />

      <slot v-else name="icon">
        <MDSymbol v-if="mdSymbol" :name="mdSymbol" />
      </slot>
    </span>

    <span class="md-extended-fab__label">{{ label }}</span>

    <MDPlainTooltip v-if="tooltip" :text="tooltip" />
  </button>
</template>

<style scoped>
.md-extended-fab {
  --md-fab-icon-size: 24dp;
  --md-fab-container-size: 56dp;
  --md-fab-horizontal-padding: 16dp;
  --md-fab-container-shape: var(--md-sys-shape-corner-large);
  --md-container-color: var(--md-fab-container-color);
  --md-content-color: var(--md-fab-icon-color);
  --md-state-box-shadow: var(--md-sys-elevation-level3);

  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  min-width: var(--md-fab-container-size);
  height: var(--md-fab-container-size);
  padding: 0 var(--md-fab-horizontal-padding);
  border: 0;
  border-radius: var(--md-fab-container-shape);
  background: var(--md-container-color);
  color: var(--md-content-color);
  box-shadow: var(--md-state-box-shadow);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:disabled {
    cursor: default;
  }

  &_color_primary {
    --md-fab-container-color: var(--md-sys-color-primary);
    --md-fab-icon-color: var(--md-sys-color-on-primary);
  }

  &_color_secondary {
    --md-fab-container-color: var(--md-sys-color-secondary);
    --md-fab-icon-color: var(--md-sys-color-on-secondary);
  }

  &_color_tertiary {
    --md-fab-container-color: var(--md-sys-color-tertiary);
    --md-fab-icon-color: var(--md-sys-color-on-tertiary);
  }

  &_color_tonal-primary {
    --md-fab-container-color: var(--md-sys-color-primary-container);
    --md-fab-icon-color: var(--md-sys-color-on-primary-container);
  }

  &_color_tonal-secondary {
    --md-fab-container-color: var(--md-sys-color-secondary-container);
    --md-fab-icon-color: var(--md-sys-color-on-secondary-container);
  }

  &_color_tonal-tertiary {
    --md-fab-container-color: var(--md-sys-color-tertiary-container);
    --md-fab-icon-color: var(--md-sys-color-on-tertiary-container);
  }

  &:hover {
    --md-state-box-shadow: var(--md-sys-elevation-level4);
  }

  &__icon,
  &__label {
    position: relative;
    z-index: 1;
  }

  &__icon {
    display: inline-flex;
    width: var(--md-fab-icon-size);
    height: var(--md-fab-icon-size);
    color: var(--md-fab-icon-color);
    justify-content: center;
    align-items: center;
  }

  &__label {
    font-family: var(--md-sys-typescale-title-medium-font);
    font-weight: var(--md-sys-typescale-title-medium-weight);
    font-size: var(--md-sys-typescale-title-medium-size);
    line-height: var(--md-sys-typescale-title-medium-line-height);
    letter-spacing: var(--md-sys-typescale-title-medium-tracking);
    white-space: nowrap;
  }

  &_size_medium {
    --md-fab-container-size: 80dp;
    --md-fab-icon-size: 28dp;
    --md-fab-container-shape: var(--md-sys-shape-corner-large-increased);
  }

  &_size_large {
    --md-fab-container-size: 96dp;
    --md-fab-icon-size: 36dp;
    --md-fab-container-shape: var(--md-sys-shape-corner-extra-large);
  }
}
</style>
