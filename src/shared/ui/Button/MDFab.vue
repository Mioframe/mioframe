<script setup lang="ts">
import { computed, onMounted, useSlots, useTemplateRef, warn } from 'vue';
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { MDPlainTooltip } from '../Tooltips';
import { MDStateLayer, useRipple, useStateLayer } from '../State';
import { MDSymbol } from '../Icon';

const props = withDefaults(
  defineProps<{
    /** Material FAB size variant. */
    size?: 'regular' | 'medium' | 'large' | undefined;
    /** Material FAB color role. */
    color?:
      | 'primary'
      | 'secondary'
      | 'tertiary'
      | 'primary-container'
      | 'secondary-container'
      | 'tertiary-container'
      | undefined;
    /** Accessible action label and tooltip text for the FAB. */
    tooltip: string;
    /**
     * Loading state for the action. `true` shows indeterminate progress; a number shows
     * determinate progress and keeps `0` visible as an active loading state.
     */
    loading?: number | boolean | undefined;
    /** Optional Material Symbols icon name used when no custom icon slot is provided. */
    mdSymbol?: string | undefined;
  }>(),
  { size: 'regular', color: 'primary' },
);

const emit = defineEmits<{
  /** Emitted after native click handling is stopped from bubbling to parent action surfaces. */
  click: [payload: MouseEvent];
}>();

defineSlots<{
  /** Optional icon content rendered when the component is not loading. */
  icon(): unknown;
}>();

const slots = useSlots();

const sizeClass = computed(() => `md-fab_size_${props.size}`);

const typeClass = computed(() => {
  return `md-fab_color_${props.color}`;
});

const hasLoading = computed(() => props.loading !== undefined && props.loading !== false);
const loadingProgress = computed(() =>
  typeof props.loading === 'number' ? props.loading : undefined,
);

const onFabClick = (event: MouseEvent) => {
  event.stopPropagation();
  emit('click', event);
};

const buttonEl = useTemplateRef<HTMLButtonElement>('buttonEl');
const { hover, focused, durationPressedState } = useStateLayer(buttonEl);

useRipple(buttonEl);

if (import.meta.env.DEV) {
  onMounted(() => {
    if (!props.mdSymbol && !slots.icon) {
      warn('MDFab: provide an icon via `mdSymbol` or the `icon` slot. A FAB requires an icon.');
    }
  });
}
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
      <MDCircularProgressIndicator v-if="hasLoading" :progress="loadingProgress" />

      <slot v-else name="icon">
        <MDSymbol v-if="mdSymbol" :name="mdSymbol" />
      </slot>
    </span>
    <MDPlainTooltip :text="tooltip" />
  </button>
</template>

<style scoped>
.md-fab {
  /* Focus indicator: md.comp.fab.*.focus.indicator.color resolves to the
     secondary role for every style; the global focus-indicator system already
     defaults to --md-sys-color-secondary, so no override is required here. */
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
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;

  &:disabled {
    cursor: default;
  }

  &_color_primary {
    --md-comp-fab-primary-container-color: var(--md-sys-color-primary);
    --md-comp-fab-primary-icon-color: var(--md-sys-color-on-primary);
    --md-comp-fab-primary-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-primary-hovered-container-elevation: var(--md-sys-elevation-level4);

    --md-fab-container-color: var(--md-comp-fab-primary-container-color);
    --md-fab-icon-color: var(--md-comp-fab-primary-icon-color);
    --md-state-box-shadow: var(--md-comp-fab-primary-container-elevation);

    &:hover {
      --md-state-box-shadow: var(--md-comp-fab-primary-hovered-container-elevation);
    }
  }

  &_color_secondary {
    --md-comp-fab-secondary-container-color: var(--md-sys-color-secondary);
    --md-comp-fab-secondary-icon-color: var(--md-sys-color-on-secondary);
    --md-comp-fab-secondary-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-secondary-hovered-container-elevation: var(--md-sys-elevation-level4);

    --md-fab-container-color: var(--md-comp-fab-secondary-container-color);
    --md-fab-icon-color: var(--md-comp-fab-secondary-icon-color);
    --md-state-box-shadow: var(--md-comp-fab-secondary-container-elevation);

    &:hover {
      --md-state-box-shadow: var(--md-comp-fab-secondary-hovered-container-elevation);
    }
  }

  &_color_tertiary {
    --md-comp-fab-tertiary-container-color: var(--md-sys-color-tertiary);
    --md-comp-fab-tertiary-icon-color: var(--md-sys-color-on-tertiary);
    --md-comp-fab-tertiary-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-tertiary-hovered-container-elevation: var(--md-sys-elevation-level4);

    --md-fab-container-color: var(--md-comp-fab-tertiary-container-color);
    --md-fab-icon-color: var(--md-comp-fab-tertiary-icon-color);
    --md-state-box-shadow: var(--md-comp-fab-tertiary-container-elevation);

    &:hover {
      --md-state-box-shadow: var(--md-comp-fab-tertiary-hovered-container-elevation);
    }
  }

  &_color_primary-container {
    --md-comp-fab-primary-container-container-color: var(--md-sys-color-primary-container);
    --md-comp-fab-primary-container-icon-color: var(--md-sys-color-on-primary-container);
    --md-comp-fab-primary-container-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-primary-container-hovered-container-elevation: var(--md-sys-elevation-level4);

    --md-fab-container-color: var(--md-comp-fab-primary-container-container-color);
    --md-fab-icon-color: var(--md-comp-fab-primary-container-icon-color);
    --md-state-box-shadow: var(--md-comp-fab-primary-container-container-elevation);

    &:hover {
      --md-state-box-shadow: var(--md-comp-fab-primary-container-hovered-container-elevation);
    }
  }

  &_color_secondary-container {
    --md-comp-fab-secondary-container-container-color: var(--md-sys-color-secondary-container);
    --md-comp-fab-secondary-container-icon-color: var(--md-sys-color-on-secondary-container);
    --md-comp-fab-secondary-container-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-secondary-container-hovered-container-elevation: var(--md-sys-elevation-level4);

    --md-fab-container-color: var(--md-comp-fab-secondary-container-container-color);
    --md-fab-icon-color: var(--md-comp-fab-secondary-container-icon-color);
    --md-state-box-shadow: var(--md-comp-fab-secondary-container-container-elevation);

    &:hover {
      --md-state-box-shadow: var(--md-comp-fab-secondary-container-hovered-container-elevation);
    }
  }

  &_color_tertiary-container {
    --md-comp-fab-tertiary-container-container-color: var(--md-sys-color-tertiary-container);
    --md-comp-fab-tertiary-container-icon-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-fab-tertiary-container-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-tertiary-container-hovered-container-elevation: var(--md-sys-elevation-level4);

    --md-fab-container-color: var(--md-comp-fab-tertiary-container-container-color);
    --md-fab-icon-color: var(--md-comp-fab-tertiary-container-icon-color);
    --md-state-box-shadow: var(--md-comp-fab-tertiary-container-container-elevation);

    &:hover {
      --md-state-box-shadow: var(--md-comp-fab-tertiary-container-hovered-container-elevation);
    }
  }

  &__icon {
    position: relative;
    z-index: 1;
    display: inline-flex;
    width: var(--md-fab-icon-size);
    height: var(--md-fab-icon-size);
    color: var(--md-fab-icon-color);
    justify-content: center;
    align-items: center;
  }

  &_size_regular {
    --md-comp-fab-container-height: 56dp;
    --md-comp-fab-icon-size: 24dp;
    --md-comp-fab-container-shape: var(--md-sys-shape-corner-large);

    --md-fab-container-size: var(--md-comp-fab-container-height);
    --md-fab-icon-size: var(--md-comp-fab-icon-size);
    --md-fab-container-shape: var(--md-comp-fab-container-shape);
  }

  &_size_medium {
    --md-comp-fab-medium-container-height: 80dp;
    --md-comp-fab-medium-icon-size: 28dp;
    --md-comp-fab-medium-container-shape: var(--md-sys-shape-corner-large-increased);

    --md-fab-container-size: var(--md-comp-fab-medium-container-height);
    --md-fab-icon-size: var(--md-comp-fab-medium-icon-size);
    --md-fab-container-shape: var(--md-comp-fab-medium-container-shape);
  }

  &_size_large {
    --md-comp-fab-large-container-height: 96dp;
    --md-comp-fab-large-icon-size: 36dp;
    --md-comp-fab-large-container-shape: var(--md-sys-shape-corner-extra-large);

    --md-fab-container-size: var(--md-comp-fab-large-container-height);
    --md-fab-icon-size: var(--md-comp-fab-large-icon-size);
    --md-fab-container-shape: var(--md-comp-fab-large-container-shape);
  }
}
</style>
