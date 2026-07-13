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
    /** Material Extended FAB color role. Primary container is the shared default for this surface. */
    color?:
      | 'primary'
      | 'secondary'
      | 'tertiary'
      | 'primary-container'
      | 'secondary-container'
      | 'tertiary-container'
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
    color: 'primary-container',
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
  /* Focus indicator: md.comp.extended-fab.{primary,secondary,tertiary}.focus.indicator.color
     resolves to the secondary role; no distinct tokens exist for the *-container styles
     (documented gap), so the global focus-indicator default (--md-sys-color-secondary) is
     reused for all six styles without a component override. */
  --md-fab-icon-size: 24dp;
  --md-fab-container-size: 56dp;
  --md-fab-horizontal-padding: 16dp;
  --md-fab-container-shape: var(--md-sys-shape-corner-large);
  --md-extended-fab-icon-label-space: 8dp;
  --md-extended-fab-label-font: var(--md-sys-typescale-title-medium-font);
  --md-extended-fab-label-weight: var(--md-sys-typescale-title-medium-weight);
  --md-extended-fab-label-size: var(--md-sys-typescale-title-medium-size);
  --md-extended-fab-label-line-height: var(--md-sys-typescale-title-medium-line-height);
  --md-extended-fab-label-tracking: var(--md-sys-typescale-title-medium-tracking);
  --md-container-color: var(--md-fab-container-color);
  --md-content-color: var(--md-fab-icon-color);
  --md-state-box-shadow: var(--md-sys-elevation-level3);

  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--md-extended-fab-icon-label-space);
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
    --md-comp-extended-fab-primary-container-color: var(--md-sys-color-primary);
    --md-comp-extended-fab-primary-label-text-color: var(--md-sys-color-on-primary);
    --md-comp-extended-fab-primary-icon-color: var(--md-sys-color-on-primary);
    --md-comp-extended-fab-primary-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-extended-fab-primary-hovered-container-elevation: var(--md-sys-elevation-level4);

    --md-fab-container-color: var(--md-comp-extended-fab-primary-container-color);
    --md-fab-icon-color: var(--md-comp-extended-fab-primary-icon-color);
    --md-content-color: var(--md-comp-extended-fab-primary-label-text-color);
    --md-state-box-shadow: var(--md-comp-extended-fab-primary-container-elevation);

    &:hover {
      --md-state-box-shadow: var(--md-comp-extended-fab-primary-hovered-container-elevation);
    }
  }

  &_color_secondary {
    --md-comp-extended-fab-secondary-container-color: var(--md-sys-color-secondary);
    --md-comp-extended-fab-secondary-label-text-color: var(--md-sys-color-on-secondary);
    --md-comp-extended-fab-secondary-icon-color: var(--md-sys-color-on-secondary);
    --md-comp-extended-fab-secondary-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-extended-fab-secondary-hovered-container-elevation: var(--md-sys-elevation-level4);

    --md-fab-container-color: var(--md-comp-extended-fab-secondary-container-color);
    --md-fab-icon-color: var(--md-comp-extended-fab-secondary-icon-color);
    --md-content-color: var(--md-comp-extended-fab-secondary-label-text-color);
    --md-state-box-shadow: var(--md-comp-extended-fab-secondary-container-elevation);

    &:hover {
      --md-state-box-shadow: var(--md-comp-extended-fab-secondary-hovered-container-elevation);
    }
  }

  &_color_tertiary {
    --md-comp-extended-fab-tertiary-container-color: var(--md-sys-color-tertiary);
    --md-comp-extended-fab-tertiary-label-text-color: var(--md-sys-color-on-tertiary);
    --md-comp-extended-fab-tertiary-icon-color: var(--md-sys-color-on-tertiary);
    --md-comp-extended-fab-tertiary-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-extended-fab-tertiary-hovered-container-elevation: var(--md-sys-elevation-level4);

    --md-fab-container-color: var(--md-comp-extended-fab-tertiary-container-color);
    --md-fab-icon-color: var(--md-comp-extended-fab-tertiary-icon-color);
    --md-content-color: var(--md-comp-extended-fab-tertiary-label-text-color);
    --md-state-box-shadow: var(--md-comp-extended-fab-tertiary-container-elevation);

    &:hover {
      --md-state-box-shadow: var(--md-comp-extended-fab-tertiary-hovered-container-elevation);
    }
  }

  &_color_primary-container {
    --md-comp-extended-fab-primary-container-container-color: var(--md-sys-color-primary-container);
    --md-comp-extended-fab-primary-container-label-text-color: var(
      --md-sys-color-on-primary-container
    );
    --md-comp-extended-fab-primary-container-icon-color: var(--md-sys-color-on-primary-container);
    --md-comp-extended-fab-primary-container-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-extended-fab-primary-container-hovered-container-elevation: var(
      --md-sys-elevation-level4
    );

    --md-fab-container-color: var(--md-comp-extended-fab-primary-container-container-color);
    --md-fab-icon-color: var(--md-comp-extended-fab-primary-container-icon-color);
    --md-content-color: var(--md-comp-extended-fab-primary-container-label-text-color);
    --md-state-box-shadow: var(--md-comp-extended-fab-primary-container-container-elevation);

    &:hover {
      --md-state-box-shadow: var(
        --md-comp-extended-fab-primary-container-hovered-container-elevation
      );
    }
  }

  &_color_secondary-container {
    --md-comp-extended-fab-secondary-container-container-color: var(
      --md-sys-color-secondary-container
    );
    --md-comp-extended-fab-secondary-container-label-text-color: var(
      --md-sys-color-on-secondary-container
    );
    --md-comp-extended-fab-secondary-container-icon-color: var(
      --md-sys-color-on-secondary-container
    );
    --md-comp-extended-fab-secondary-container-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-extended-fab-secondary-container-hovered-container-elevation: var(
      --md-sys-elevation-level4
    );

    --md-fab-container-color: var(--md-comp-extended-fab-secondary-container-container-color);
    --md-fab-icon-color: var(--md-comp-extended-fab-secondary-container-icon-color);
    --md-content-color: var(--md-comp-extended-fab-secondary-container-label-text-color);
    --md-state-box-shadow: var(--md-comp-extended-fab-secondary-container-container-elevation);

    &:hover {
      --md-state-box-shadow: var(
        --md-comp-extended-fab-secondary-container-hovered-container-elevation
      );
    }
  }

  &_color_tertiary-container {
    --md-comp-extended-fab-tertiary-container-container-color: var(
      --md-sys-color-tertiary-container
    );
    --md-comp-extended-fab-tertiary-container-label-text-color: var(
      --md-sys-color-on-tertiary-container
    );
    --md-comp-extended-fab-tertiary-container-icon-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-extended-fab-tertiary-container-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-extended-fab-tertiary-container-hovered-container-elevation: var(
      --md-sys-elevation-level4
    );

    --md-fab-container-color: var(--md-comp-extended-fab-tertiary-container-container-color);
    --md-fab-icon-color: var(--md-comp-extended-fab-tertiary-container-icon-color);
    --md-content-color: var(--md-comp-extended-fab-tertiary-container-label-text-color);
    --md-state-box-shadow: var(--md-comp-extended-fab-tertiary-container-container-elevation);

    &:hover {
      --md-state-box-shadow: var(
        --md-comp-extended-fab-tertiary-container-hovered-container-elevation
      );
    }
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
    font-family: var(--md-extended-fab-label-font);
    font-weight: var(--md-extended-fab-label-weight);
    font-size: var(--md-extended-fab-label-size);
    line-height: var(--md-extended-fab-label-line-height);
    letter-spacing: var(--md-extended-fab-label-tracking);
    white-space: nowrap;
  }

  &_size_small {
    --md-comp-extended-fab-small-container-height: 56dp;
    --md-comp-extended-fab-small-icon-size: 24dp;
    --md-comp-extended-fab-small-container-shape: var(--md-sys-shape-corner-large);
    --md-comp-extended-fab-small-leading-space: 16dp;
    --md-comp-extended-fab-small-icon-label-space: 8dp;
    --md-comp-extended-fab-small-trailing-space: 16dp;

    --md-fab-container-size: var(--md-comp-extended-fab-small-container-height);
    --md-fab-icon-size: var(--md-comp-extended-fab-small-icon-size);
    --md-fab-container-shape: var(--md-comp-extended-fab-small-container-shape);
    --md-fab-horizontal-padding: var(--md-comp-extended-fab-small-leading-space);
    --md-extended-fab-icon-label-space: var(--md-comp-extended-fab-small-icon-label-space);
    --md-extended-fab-label-font: var(--md-sys-typescale-title-medium-font);
    --md-extended-fab-label-weight: var(--md-sys-typescale-title-medium-weight);
    --md-extended-fab-label-size: var(--md-sys-typescale-title-medium-size);
    --md-extended-fab-label-line-height: var(--md-sys-typescale-title-medium-line-height);
    --md-extended-fab-label-tracking: var(--md-sys-typescale-title-medium-tracking);
  }

  &_size_medium {
    --md-comp-extended-fab-medium-container-height: 80dp;
    --md-comp-extended-fab-medium-icon-size: 28dp;
    --md-comp-extended-fab-medium-container-shape: var(--md-sys-shape-corner-large-increased);
    --md-comp-extended-fab-medium-leading-space: 26dp;
    --md-comp-extended-fab-medium-icon-label-space: 12dp;
    --md-comp-extended-fab-medium-trailing-space: 26dp;

    --md-fab-container-size: var(--md-comp-extended-fab-medium-container-height);
    --md-fab-icon-size: var(--md-comp-extended-fab-medium-icon-size);
    --md-fab-container-shape: var(--md-comp-extended-fab-medium-container-shape);
    --md-fab-horizontal-padding: var(--md-comp-extended-fab-medium-leading-space);
    --md-extended-fab-icon-label-space: var(--md-comp-extended-fab-medium-icon-label-space);
    --md-extended-fab-label-font: var(--md-sys-typescale-title-large-font);
    --md-extended-fab-label-weight: var(--md-sys-typescale-title-large-weight);
    --md-extended-fab-label-size: var(--md-sys-typescale-title-large-size);
    --md-extended-fab-label-line-height: var(--md-sys-typescale-title-large-line-height);
    --md-extended-fab-label-tracking: var(--md-sys-typescale-title-large-tracking);
  }

  &_size_large {
    --md-comp-extended-fab-large-container-height: 96dp;
    --md-comp-extended-fab-large-icon-size: 36dp;
    --md-comp-extended-fab-large-container-shape: var(--md-sys-shape-corner-extra-large);
    --md-comp-extended-fab-large-leading-space: 28dp;
    --md-comp-extended-fab-large-icon-label-space: 16dp;
    --md-comp-extended-fab-large-trailing-space: 28dp;

    --md-fab-container-size: var(--md-comp-extended-fab-large-container-height);
    --md-fab-icon-size: var(--md-comp-extended-fab-large-icon-size);
    --md-fab-container-shape: var(--md-comp-extended-fab-large-container-shape);
    --md-fab-horizontal-padding: var(--md-comp-extended-fab-large-leading-space);
    --md-extended-fab-icon-label-space: var(--md-comp-extended-fab-large-icon-label-space);
    --md-extended-fab-label-font: var(--md-sys-typescale-headline-small-font);
    --md-extended-fab-label-weight: var(--md-sys-typescale-headline-small-weight);
    --md-extended-fab-label-size: var(--md-sys-typescale-headline-small-size);
    --md-extended-fab-label-line-height: var(--md-sys-typescale-headline-small-line-height);
    --md-extended-fab-label-tracking: var(--md-sys-typescale-headline-small-tracking);
  }
}
</style>
