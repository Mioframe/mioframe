<script setup lang="ts">
import { computed, onMounted, useSlots, useTemplateRef, warn } from 'vue';
import { MDCircularProgressIndicator } from '../material';
import { MDPlainTooltip } from '../Tooltips';
import { MDStateLayer, useRipple, useStateLayer } from '@shared/ui/material/foundation/state';
import { MDSymbol } from '../Icon';

const props = withDefaults(
  defineProps<{
    /** Material FAB size variant. Defaults to `"regular"`. */
    size?: 'regular' | 'medium' | 'large' | undefined;
    /** Material FAB color role. Defaults to `"primary-container"`. */
    color?:
      | 'primary'
      | 'secondary'
      | 'tertiary'
      | 'primary-container'
      | 'secondary-container'
      | 'tertiary-container'
      | undefined;
    /** Accessible action label and tooltip text for the FAB. Required — the FAB has no other label source. */
    tooltip: string;
    /**
     * Loading state for the action. `true` shows an indeterminate progress indicator; a
     * number (including `0`) shows a determinate ring at that value. Loading replaces the icon
     * slot.
     */
    loading?: number | boolean | undefined;
    /** Optional Material Symbols icon name used when no custom `icon` slot is provided. One of `mdSymbol` or the `icon` slot is required. */
    mdSymbol?: string | undefined;
  }>(),
  { size: 'regular', color: 'primary-container' },
);

const emit = defineEmits<{
  /** Emitted after native click handling is stopped from bubbling to parent action surfaces. */
  click: [payload: MouseEvent];
}>();

defineSlots<{
  /** Optional icon content rendered when the component is not loading. Takes precedence over `mdSymbol`. */
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
      <MDCircularProgressIndicator
        v-if="hasLoading"
        class="md-fab__progress-indicator"
        :progress="loadingProgress"
      />

      <slot v-else name="icon">
        <MDSymbol v-if="mdSymbol" :name="mdSymbol" />
      </slot>
    </span>
    <MDPlainTooltip :text="tooltip" />
  </button>
</template>

<style scoped>
.md-fab {
  /* Focus indicator: md.comp.fab.{primary,secondary,tertiary}.focus.indicator.* publish
     component tokens (routed below); the *-container styles publish no distinct focus
     indicator tokens (documented gap), so they keep the generic system default. */
  --md-fab-icon-size: 24dp;
  --md-private-fab-container-width: 56dp;
  --md-private-fab-container-height: 56dp;
  --md-fab-container-shape: var(--md-sys-shape-corner-large);
  --md-private-fab-container-color: transparent;
  --md-private-fab-icon-color: inherit;
  --md-private-fab-elevation: var(--md-sys-elevation-level3);
  --md-private-fab-state-layer-color: var(--md-private-fab-icon-color);
  --md-private-fab-hover-icon-color: var(--md-private-fab-icon-color);
  --md-private-fab-focus-icon-color: var(--md-private-fab-icon-color);
  --md-private-fab-pressed-icon-color: var(--md-private-fab-icon-color);
  --md-private-fab-hover-elevation: var(--md-private-fab-elevation);
  --md-private-fab-focus-elevation: var(--md-private-fab-elevation);
  --md-private-fab-pressed-elevation: var(--md-private-fab-elevation);
  --md-private-fab-hover-state-layer-color: var(--md-private-fab-state-layer-color);
  --md-private-fab-focus-state-layer-color: var(--md-private-fab-state-layer-color);
  --md-private-fab-pressed-state-layer-color: var(--md-private-fab-state-layer-color);
  --md-private-fab-rendered-container-color: var(--md-private-fab-container-color);
  --md-private-fab-rendered-icon-color: var(--md-private-fab-icon-color);
  --md-private-fab-rendered-elevation: var(--md-private-fab-elevation);
  --md-private-fab-rendered-state-layer-color: var(--md-private-fab-state-layer-color);
  --md-private-state-hover-state-layer-opacity: var(--md-sys-state-hover-state-layer-opacity);
  --md-private-state-focus-state-layer-opacity: var(--md-sys-state-focus-state-layer-opacity);
  --md-private-state-pressed-state-layer-opacity: var(--md-sys-state-pressed-state-layer-opacity);
  --md-private-state-layer-color: var(--md-private-fab-rendered-state-layer-color);
  --md-private-state-layer-transition-duration: var(
    --md-private-motion-expressive-fast-effects-duration
  );
  --md-private-state-layer-transition-easing: var(
    --md-private-motion-expressive-fast-effects-easing
  );

  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  width: var(--md-private-fab-container-width);
  height: var(--md-private-fab-container-height);
  border: 0;
  border-radius: var(--md-fab-container-shape);
  background: var(--md-private-fab-rendered-container-color);
  color: var(--md-private-fab-rendered-icon-color);
  box-shadow: var(--md-private-fab-rendered-elevation);
  cursor: pointer;
  transition:
    box-shadow var(--md-private-motion-expressive-fast-spatial-duration)
      var(--md-private-motion-expressive-fast-spatial-easing),
    color var(--md-private-motion-expressive-fast-effects-duration)
      var(--md-private-motion-expressive-fast-effects-easing),
    background-color var(--md-private-motion-expressive-fast-effects-duration)
      var(--md-private-motion-expressive-fast-effects-easing);
  -webkit-tap-highlight-color: transparent;

  &:disabled {
    cursor: default;
  }

  &_color_primary {
    --md-comp-fab-primary-container-color: var(--md-sys-color-primary);
    --md-comp-fab-primary-icon-color: var(--md-sys-color-on-primary);
    --md-comp-fab-primary-container-shadow-color: var(--md-sys-color-shadow);
    --md-comp-fab-primary-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-primary-focus-indicator-color: var(--md-sys-color-secondary);
    --md-comp-fab-primary-focus-indicator-thickness: var(--md-sys-state-focus-indicator-thickness);
    --md-comp-fab-primary-focus-indicator-outline-offset: var(
      --md-sys-state-focus-indicator-outer-offset
    );

    --md-focus-indicator-color: var(--md-comp-fab-primary-focus-indicator-color);
    --md-focus-indicator-thickness: var(--md-comp-fab-primary-focus-indicator-thickness);
    --md-focus-indicator-offset: var(--md-comp-fab-primary-focus-indicator-outline-offset);
    --md-comp-fab-primary-hovered-icon-color: var(--md-sys-color-on-primary);
    --md-comp-fab-primary-focused-icon-color: var(--md-sys-color-on-primary);
    --md-comp-fab-primary-pressed-icon-color: var(--md-sys-color-on-primary);
    --md-comp-fab-primary-hovered-container-elevation: var(--md-sys-elevation-level4);
    --md-comp-fab-primary-focused-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-primary-pressed-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-primary-hovered-state-layer-color: var(--md-sys-color-on-primary);
    --md-comp-fab-primary-focused-state-layer-color: var(--md-sys-color-on-primary);
    --md-comp-fab-primary-pressed-state-layer-color: var(--md-sys-color-on-primary);
    --md-comp-fab-primary-hovered-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity
    );
    --md-comp-fab-primary-focused-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity
    );
    --md-comp-fab-primary-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity
    );

    --md-private-fab-container-color: var(--md-comp-fab-primary-container-color);
    --md-private-fab-icon-color: var(--md-comp-fab-primary-icon-color);
    --md-private-elevation-shadow-color: var(--md-comp-fab-primary-container-shadow-color);
    --md-private-fab-elevation: var(--md-comp-fab-primary-container-elevation);
    --md-private-fab-hover-icon-color: var(--md-comp-fab-primary-hovered-icon-color);
    --md-private-fab-focus-icon-color: var(--md-comp-fab-primary-focused-icon-color);
    --md-private-fab-pressed-icon-color: var(--md-comp-fab-primary-pressed-icon-color);
    --md-private-fab-hover-elevation: var(--md-comp-fab-primary-hovered-container-elevation);
    --md-private-fab-focus-elevation: var(--md-comp-fab-primary-focused-container-elevation);
    --md-private-fab-pressed-elevation: var(--md-comp-fab-primary-pressed-container-elevation);
    --md-private-fab-hover-state-layer-color: var(--md-comp-fab-primary-hovered-state-layer-color);
    --md-private-fab-focus-state-layer-color: var(--md-comp-fab-primary-focused-state-layer-color);
    --md-private-fab-pressed-state-layer-color: var(
      --md-comp-fab-primary-pressed-state-layer-color
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-fab-primary-hovered-state-layer-opacity
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-fab-primary-focused-state-layer-opacity
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-fab-primary-pressed-state-layer-opacity
    );
  }

  &_color_secondary {
    --md-comp-fab-secondary-container-color: var(--md-sys-color-secondary);
    --md-comp-fab-secondary-icon-color: var(--md-sys-color-on-secondary);
    --md-comp-fab-secondary-container-shadow-color: var(--md-sys-color-shadow);
    --md-comp-fab-secondary-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-secondary-focus-indicator-color: var(--md-sys-color-secondary);
    --md-comp-fab-secondary-focus-indicator-thickness: var(
      --md-sys-state-focus-indicator-thickness
    );
    --md-comp-fab-secondary-focus-indicator-outline-offset: var(
      --md-sys-state-focus-indicator-outer-offset
    );

    --md-focus-indicator-color: var(--md-comp-fab-secondary-focus-indicator-color);
    --md-focus-indicator-thickness: var(--md-comp-fab-secondary-focus-indicator-thickness);
    --md-focus-indicator-offset: var(--md-comp-fab-secondary-focus-indicator-outline-offset);
    --md-comp-fab-secondary-hovered-icon-color: var(--md-sys-color-on-secondary);
    --md-comp-fab-secondary-focused-icon-color: var(--md-sys-color-on-secondary);
    --md-comp-fab-secondary-pressed-icon-color: var(--md-sys-color-on-secondary);
    --md-comp-fab-secondary-hovered-container-elevation: var(--md-sys-elevation-level4);
    --md-comp-fab-secondary-focused-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-secondary-pressed-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-secondary-hovered-state-layer-color: var(--md-sys-color-on-secondary);
    --md-comp-fab-secondary-focused-state-layer-color: var(--md-sys-color-on-secondary);
    --md-comp-fab-secondary-pressed-state-layer-color: var(--md-sys-color-on-secondary);
    --md-comp-fab-secondary-hovered-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity
    );
    --md-comp-fab-secondary-focused-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity
    );
    --md-comp-fab-secondary-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity
    );

    --md-private-fab-container-color: var(--md-comp-fab-secondary-container-color);
    --md-private-fab-icon-color: var(--md-comp-fab-secondary-icon-color);
    --md-private-elevation-shadow-color: var(--md-comp-fab-secondary-container-shadow-color);
    --md-private-fab-elevation: var(--md-comp-fab-secondary-container-elevation);
    --md-private-fab-hover-icon-color: var(--md-comp-fab-secondary-hovered-icon-color);
    --md-private-fab-focus-icon-color: var(--md-comp-fab-secondary-focused-icon-color);
    --md-private-fab-pressed-icon-color: var(--md-comp-fab-secondary-pressed-icon-color);
    --md-private-fab-hover-elevation: var(--md-comp-fab-secondary-hovered-container-elevation);
    --md-private-fab-focus-elevation: var(--md-comp-fab-secondary-focused-container-elevation);
    --md-private-fab-pressed-elevation: var(--md-comp-fab-secondary-pressed-container-elevation);
    --md-private-fab-hover-state-layer-color: var(
      --md-comp-fab-secondary-hovered-state-layer-color
    );
    --md-private-fab-focus-state-layer-color: var(
      --md-comp-fab-secondary-focused-state-layer-color
    );
    --md-private-fab-pressed-state-layer-color: var(
      --md-comp-fab-secondary-pressed-state-layer-color
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-fab-secondary-hovered-state-layer-opacity
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-fab-secondary-focused-state-layer-opacity
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-fab-secondary-pressed-state-layer-opacity
    );
  }

  &_color_tertiary {
    --md-comp-fab-tertiary-container-color: var(--md-sys-color-tertiary);
    --md-comp-fab-tertiary-icon-color: var(--md-sys-color-on-tertiary);
    --md-comp-fab-tertiary-container-shadow-color: var(--md-sys-color-shadow);
    --md-comp-fab-tertiary-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-tertiary-focus-indicator-color: var(--md-sys-color-secondary);
    --md-comp-fab-tertiary-focus-indicator-thickness: var(--md-sys-state-focus-indicator-thickness);
    --md-comp-fab-tertiary-focus-indicator-outline-offset: var(
      --md-sys-state-focus-indicator-outer-offset
    );

    --md-focus-indicator-color: var(--md-comp-fab-tertiary-focus-indicator-color);
    --md-focus-indicator-thickness: var(--md-comp-fab-tertiary-focus-indicator-thickness);
    --md-focus-indicator-offset: var(--md-comp-fab-tertiary-focus-indicator-outline-offset);
    --md-comp-fab-tertiary-hovered-icon-color: var(--md-sys-color-on-tertiary);
    --md-comp-fab-tertiary-focused-icon-color: var(--md-sys-color-on-tertiary);
    --md-comp-fab-tertiary-pressed-icon-color: var(--md-sys-color-on-tertiary);
    --md-comp-fab-tertiary-hovered-container-elevation: var(--md-sys-elevation-level4);
    --md-comp-fab-tertiary-focused-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-tertiary-pressed-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-tertiary-hovered-state-layer-color: var(--md-sys-color-on-tertiary);
    --md-comp-fab-tertiary-focused-state-layer-color: var(--md-sys-color-on-tertiary);
    --md-comp-fab-tertiary-pressed-state-layer-color: var(--md-sys-color-on-tertiary);
    --md-comp-fab-tertiary-hovered-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity
    );
    --md-comp-fab-tertiary-focused-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity
    );
    --md-comp-fab-tertiary-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity
    );

    --md-private-fab-container-color: var(--md-comp-fab-tertiary-container-color);
    --md-private-fab-icon-color: var(--md-comp-fab-tertiary-icon-color);
    --md-private-elevation-shadow-color: var(--md-comp-fab-tertiary-container-shadow-color);
    --md-private-fab-elevation: var(--md-comp-fab-tertiary-container-elevation);
    --md-private-fab-hover-icon-color: var(--md-comp-fab-tertiary-hovered-icon-color);
    --md-private-fab-focus-icon-color: var(--md-comp-fab-tertiary-focused-icon-color);
    --md-private-fab-pressed-icon-color: var(--md-comp-fab-tertiary-pressed-icon-color);
    --md-private-fab-hover-elevation: var(--md-comp-fab-tertiary-hovered-container-elevation);
    --md-private-fab-focus-elevation: var(--md-comp-fab-tertiary-focused-container-elevation);
    --md-private-fab-pressed-elevation: var(--md-comp-fab-tertiary-pressed-container-elevation);
    --md-private-fab-hover-state-layer-color: var(--md-comp-fab-tertiary-hovered-state-layer-color);
    --md-private-fab-focus-state-layer-color: var(--md-comp-fab-tertiary-focused-state-layer-color);
    --md-private-fab-pressed-state-layer-color: var(
      --md-comp-fab-tertiary-pressed-state-layer-color
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-fab-tertiary-hovered-state-layer-opacity
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-fab-tertiary-focused-state-layer-opacity
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-fab-tertiary-pressed-state-layer-opacity
    );
  }

  &_color_primary-container {
    --md-comp-fab-primary-container-container-color: var(--md-sys-color-primary-container);
    --md-comp-fab-primary-container-icon-color: var(--md-sys-color-on-primary-container);
    --md-comp-fab-primary-container-container-shadow-color: var(--md-sys-color-shadow);
    --md-comp-fab-primary-container-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-primary-container-hovered-icon-color: var(--md-sys-color-on-primary-container);
    --md-comp-fab-primary-container-focused-icon-color: var(--md-sys-color-on-primary-container);
    --md-comp-fab-primary-container-pressed-icon-color: var(--md-sys-color-on-primary-container);
    --md-comp-fab-primary-container-hovered-container-elevation: var(--md-sys-elevation-level4);
    --md-comp-fab-primary-container-focused-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-primary-container-pressed-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-primary-container-hovered-state-layer-color: var(
      --md-sys-color-on-primary-container
    );
    --md-comp-fab-primary-container-focused-state-layer-color: var(
      --md-sys-color-on-primary-container
    );
    --md-comp-fab-primary-container-pressed-state-layer-color: var(
      --md-sys-color-on-primary-container
    );
    --md-comp-fab-primary-container-hovered-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity
    );
    --md-comp-fab-primary-container-focused-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity
    );
    --md-comp-fab-primary-container-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity
    );

    --md-private-fab-container-color: var(--md-comp-fab-primary-container-container-color);
    --md-private-fab-icon-color: var(--md-comp-fab-primary-container-icon-color);
    --md-private-elevation-shadow-color: var(
      --md-comp-fab-primary-container-container-shadow-color
    );
    --md-private-fab-elevation: var(--md-comp-fab-primary-container-container-elevation);
    --md-private-fab-hover-icon-color: var(--md-comp-fab-primary-container-hovered-icon-color);
    --md-private-fab-focus-icon-color: var(--md-comp-fab-primary-container-focused-icon-color);
    --md-private-fab-pressed-icon-color: var(--md-comp-fab-primary-container-pressed-icon-color);
    --md-private-fab-hover-elevation: var(
      --md-comp-fab-primary-container-hovered-container-elevation
    );
    --md-private-fab-focus-elevation: var(
      --md-comp-fab-primary-container-focused-container-elevation
    );
    --md-private-fab-pressed-elevation: var(
      --md-comp-fab-primary-container-pressed-container-elevation
    );
    --md-private-fab-hover-state-layer-color: var(
      --md-comp-fab-primary-container-hovered-state-layer-color
    );
    --md-private-fab-focus-state-layer-color: var(
      --md-comp-fab-primary-container-focused-state-layer-color
    );
    --md-private-fab-pressed-state-layer-color: var(
      --md-comp-fab-primary-container-pressed-state-layer-color
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-fab-primary-container-hovered-state-layer-opacity
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-fab-primary-container-focused-state-layer-opacity
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-fab-primary-container-pressed-state-layer-opacity
    );
  }

  &_color_secondary-container {
    --md-comp-fab-secondary-container-container-color: var(--md-sys-color-secondary-container);
    --md-comp-fab-secondary-container-icon-color: var(--md-sys-color-on-secondary-container);
    --md-comp-fab-secondary-container-container-shadow-color: var(--md-sys-color-shadow);
    --md-comp-fab-secondary-container-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-secondary-container-hovered-icon-color: var(
      --md-sys-color-on-secondary-container
    );
    --md-comp-fab-secondary-container-focused-icon-color: var(
      --md-sys-color-on-secondary-container
    );
    --md-comp-fab-secondary-container-pressed-icon-color: var(
      --md-sys-color-on-secondary-container
    );
    --md-comp-fab-secondary-container-hovered-container-elevation: var(--md-sys-elevation-level4);
    --md-comp-fab-secondary-container-focused-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-secondary-container-pressed-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-secondary-container-hovered-state-layer-color: var(
      --md-sys-color-on-secondary-container
    );
    --md-comp-fab-secondary-container-focused-state-layer-color: var(
      --md-sys-color-on-secondary-container
    );
    --md-comp-fab-secondary-container-pressed-state-layer-color: var(
      --md-sys-color-on-secondary-container
    );
    --md-comp-fab-secondary-container-hovered-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity
    );
    --md-comp-fab-secondary-container-focused-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity
    );
    --md-comp-fab-secondary-container-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity
    );

    --md-private-fab-container-color: var(--md-comp-fab-secondary-container-container-color);
    --md-private-fab-icon-color: var(--md-comp-fab-secondary-container-icon-color);
    --md-private-elevation-shadow-color: var(
      --md-comp-fab-secondary-container-container-shadow-color
    );
    --md-private-fab-elevation: var(--md-comp-fab-secondary-container-container-elevation);
    --md-private-fab-hover-icon-color: var(--md-comp-fab-secondary-container-hovered-icon-color);
    --md-private-fab-focus-icon-color: var(--md-comp-fab-secondary-container-focused-icon-color);
    --md-private-fab-pressed-icon-color: var(--md-comp-fab-secondary-container-pressed-icon-color);
    --md-private-fab-hover-elevation: var(
      --md-comp-fab-secondary-container-hovered-container-elevation
    );
    --md-private-fab-focus-elevation: var(
      --md-comp-fab-secondary-container-focused-container-elevation
    );
    --md-private-fab-pressed-elevation: var(
      --md-comp-fab-secondary-container-pressed-container-elevation
    );
    --md-private-fab-hover-state-layer-color: var(
      --md-comp-fab-secondary-container-hovered-state-layer-color
    );
    --md-private-fab-focus-state-layer-color: var(
      --md-comp-fab-secondary-container-focused-state-layer-color
    );
    --md-private-fab-pressed-state-layer-color: var(
      --md-comp-fab-secondary-container-pressed-state-layer-color
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-fab-secondary-container-hovered-state-layer-opacity
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-fab-secondary-container-focused-state-layer-opacity
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-fab-secondary-container-pressed-state-layer-opacity
    );
  }

  &_color_tertiary-container {
    --md-comp-fab-tertiary-container-container-color: var(--md-sys-color-tertiary-container);
    --md-comp-fab-tertiary-container-icon-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-fab-tertiary-container-container-shadow-color: var(--md-sys-color-shadow);
    --md-comp-fab-tertiary-container-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-tertiary-container-hovered-icon-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-fab-tertiary-container-focused-icon-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-fab-tertiary-container-pressed-icon-color: var(--md-sys-color-on-tertiary-container);
    --md-comp-fab-tertiary-container-hovered-container-elevation: var(--md-sys-elevation-level4);
    --md-comp-fab-tertiary-container-focused-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-tertiary-container-pressed-container-elevation: var(--md-sys-elevation-level3);
    --md-comp-fab-tertiary-container-hovered-state-layer-color: var(
      --md-sys-color-on-tertiary-container
    );
    --md-comp-fab-tertiary-container-focused-state-layer-color: var(
      --md-sys-color-on-tertiary-container
    );
    --md-comp-fab-tertiary-container-pressed-state-layer-color: var(
      --md-sys-color-on-tertiary-container
    );
    --md-comp-fab-tertiary-container-hovered-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity
    );
    --md-comp-fab-tertiary-container-focused-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity
    );
    --md-comp-fab-tertiary-container-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity
    );

    --md-private-fab-container-color: var(--md-comp-fab-tertiary-container-container-color);
    --md-private-fab-icon-color: var(--md-comp-fab-tertiary-container-icon-color);
    --md-private-elevation-shadow-color: var(
      --md-comp-fab-tertiary-container-container-shadow-color
    );
    --md-private-fab-elevation: var(--md-comp-fab-tertiary-container-container-elevation);
    --md-private-fab-hover-icon-color: var(--md-comp-fab-tertiary-container-hovered-icon-color);
    --md-private-fab-focus-icon-color: var(--md-comp-fab-tertiary-container-focused-icon-color);
    --md-private-fab-pressed-icon-color: var(--md-comp-fab-tertiary-container-pressed-icon-color);
    --md-private-fab-hover-elevation: var(
      --md-comp-fab-tertiary-container-hovered-container-elevation
    );
    --md-private-fab-focus-elevation: var(
      --md-comp-fab-tertiary-container-focused-container-elevation
    );
    --md-private-fab-pressed-elevation: var(
      --md-comp-fab-tertiary-container-pressed-container-elevation
    );
    --md-private-fab-hover-state-layer-color: var(
      --md-comp-fab-tertiary-container-hovered-state-layer-color
    );
    --md-private-fab-focus-state-layer-color: var(
      --md-comp-fab-tertiary-container-focused-state-layer-color
    );
    --md-private-fab-pressed-state-layer-color: var(
      --md-comp-fab-tertiary-container-pressed-state-layer-color
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-fab-tertiary-container-hovered-state-layer-opacity
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-fab-tertiary-container-focused-state-layer-opacity
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-fab-tertiary-container-pressed-state-layer-opacity
    );
  }

  &__icon {
    position: relative;
    z-index: 1;
    display: inline-flex;
    width: var(--md-fab-icon-size);
    height: var(--md-fab-icon-size);
    color: var(--md-private-fab-rendered-icon-color);
    --md-content-color: var(--md-private-fab-rendered-icon-color);
    justify-content: center;
    align-items: center;
  }

  &__progress-indicator {
    --md-circular-progress-color: var(--md-private-fab-rendered-icon-color);
  }

  &_size_regular {
    --md-comp-fab-container-width: 56dp;
    --md-comp-fab-container-height: 56dp;
    --md-comp-fab-icon-size: 24dp;
    --md-comp-fab-container-shape: var(--md-sys-shape-corner-large);

    --md-private-fab-container-width: var(--md-comp-fab-container-width);
    --md-private-fab-container-height: var(--md-comp-fab-container-height);
    --md-fab-icon-size: var(--md-comp-fab-icon-size);
    --md-fab-container-shape: var(--md-comp-fab-container-shape);
  }

  &_size_medium {
    --md-comp-fab-medium-container-width: 80dp;
    --md-comp-fab-medium-container-height: 80dp;
    --md-comp-fab-medium-icon-size: 28dp;
    --md-comp-fab-medium-container-shape: var(--md-sys-shape-corner-large-increased);

    --md-private-fab-container-width: var(--md-comp-fab-medium-container-width);
    --md-private-fab-container-height: var(--md-comp-fab-medium-container-height);
    --md-fab-icon-size: var(--md-comp-fab-medium-icon-size);
    --md-fab-container-shape: var(--md-comp-fab-medium-container-shape);
  }

  &_size_large {
    --md-comp-fab-large-container-width: 96dp;
    --md-comp-fab-large-container-height: 96dp;
    --md-comp-fab-large-icon-size: 36dp;
    --md-comp-fab-large-container-shape: var(--md-sys-shape-corner-extra-large);

    --md-private-fab-container-width: var(--md-comp-fab-large-container-width);
    --md-private-fab-container-height: var(--md-comp-fab-large-container-height);
    --md-fab-icon-size: var(--md-comp-fab-large-icon-size);
    --md-fab-container-shape: var(--md-comp-fab-large-container-shape);
  }

  &.md-state_hover,
  &:hover {
    --md-private-fab-rendered-icon-color: var(
      --md-private-fab-hover-icon-color,
      var(--md-private-fab-icon-color)
    );
    --md-private-fab-rendered-elevation: var(
      --md-private-fab-hover-elevation,
      var(--md-private-fab-elevation)
    );
    --md-private-fab-rendered-state-layer-color: var(
      --md-private-fab-hover-state-layer-color,
      var(--md-private-fab-state-layer-color)
    );
  }

  &.md-state_focused,
  &:focus-visible {
    --md-private-fab-rendered-icon-color: var(
      --md-private-fab-focus-icon-color,
      var(--md-private-fab-icon-color)
    );
    --md-private-fab-rendered-elevation: var(
      --md-private-fab-focus-elevation,
      var(--md-private-fab-elevation)
    );
    --md-private-fab-rendered-state-layer-color: var(
      --md-private-fab-focus-state-layer-color,
      var(--md-private-fab-state-layer-color)
    );
  }

  &.md-state_pressed,
  &:active {
    --md-private-fab-rendered-icon-color: var(
      --md-private-fab-pressed-icon-color,
      var(--md-private-fab-icon-color)
    );
    --md-private-fab-rendered-elevation: var(
      --md-private-fab-pressed-elevation,
      var(--md-private-fab-elevation)
    );
    --md-private-fab-rendered-state-layer-color: var(
      --md-private-fab-pressed-state-layer-color,
      var(--md-private-fab-state-layer-color)
    );
  }
}
</style>
