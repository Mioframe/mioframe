<script setup lang="ts">
import { computed, onMounted, useTemplateRef, warn, watchEffect } from 'vue';
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { MDPlainTooltip, MDRichTooltip } from '../Tooltips';
import { MDSymbol } from '../Icon';
import { MDStateLayer, useRipple, useStateLayer } from '../State';

const props = withDefaults(
  defineProps<{
    /** Native `<button>` `type`. Defaults to `"button"` so the control never submits a form by accident. */
    nativeType?: 'button' | 'submit' | 'reset' | undefined;
    /** Material Icon Button color style. Defaults to `"standard"`. */
    color?: 'filled' | 'tonal' | 'outlined' | 'standard' | undefined;
    /** Native `disabled`. Blocks click, hover, focus, and pressed visuals; state-layer opacity forces to 0. */
    disabled?: boolean | undefined;
    /**
     * Loading state for the action. `true` shows an indeterminate progress indicator; a
     * number shows determinate progress. `0` still renders as an active loading state, but
     * the underlying `MDCircularProgressIndicator` currently renders `0` through its
     * indeterminate visual path rather than a determinate ring at zero fill.
     */
    loading?: number | boolean | undefined;
    /** Accessible name and plain-tooltip text. Required — an icon-only control has no other accessible label source. */
    tooltip: string;
    /** Also opens the rich/plain tooltip on click, not only on hover/focus. Defaults to `false`. */
    showTooltipOnClick?: boolean | undefined;
    /** Material Symbols icon name rendered when no `icon` slot is provided. */
    mdSymbolName?: string | undefined;
    /** `"default"` is a stateless action; `"toggle"` is a controlled two-state control driven by `selected`. Defaults to `"default"`. */
    variant?: 'default' | 'toggle' | undefined;
    /** Controlled selected state. Only applied when `variant="toggle"`; ignored (with a dev warning) otherwise. */
    selected?: boolean | undefined;
    /** Material Icon Button size. Defaults to `"small"`. */
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | undefined;
    /** Horizontal padding density. Defaults to `"default"`. */
    width?: 'narrow' | 'default' | 'wide' | undefined;
    /** Container shape. Toggle variants morph to the opposite shape when selected. Defaults to `"round"`. */
    shape?: 'round' | 'square' | undefined;
  }>(),
  {
    color: 'standard',
    nativeType: 'button',
    variant: 'default',
    shape: 'round',
    size: 'small',
    width: 'default',
  },
);

const emit = defineEmits<{
  /** Emitted after native click handling is stopped from bubbling to parent action surfaces. */
  click: [event: MouseEvent];
}>();

const slots = defineSlots<{
  /** Custom icon content. Falls back to an `MDSymbol` rendered from `mdSymbolName` when omitted. */
  icon(): unknown;
  /** Rich tooltip body. When provided, an `MDRichTooltip` replaces the default `MDPlainTooltip`. */
  richTooltipContent(): unknown;
}>();

const onClick = (e: MouseEvent) => {
  e.stopPropagation();
  emit('click', e);
};

const buttonEl = useTemplateRef<HTMLButtonElement>('buttonEl');
const { hover, focused: focusVisible, durationPressedState } = useStateLayer(buttonEl);
const showVisualState = computed(() => !props.disabled);
const isToggle = computed(() => props.variant === 'toggle');
const appliedSelected = computed(() => isToggle.value && !!props.selected);

useRipple(computed(() => (props.disabled ? undefined : buttonEl.value)));

if (import.meta.env.DEV) {
  onMounted(() => {
    watchEffect(() => {
      if (props.selected && !isToggle.value) {
        warn('MDIconButton: `selected` has no effect unless `variant` is "toggle".');
      }
    });
  });
}
</script>

<template>
  <button
    ref="buttonEl"
    :disabled="disabled"
    :type="props.nativeType"
    class="md-icon-button"
    :class="[
      `md-icon-button_color-${props.color}`,
      `md-icon-button_variant-${props.variant}`,
      `md-icon-button_size-${props.size}`,
      `md-icon-button_width-${props.width}`,
      `md-icon-button_shape-${props.shape}`,
      {
        'md-icon-button_selected': appliedSelected,
        'md-icon-button_loading': props.loading !== undefined && props.loading !== false,
        'md-state_hover': showVisualState && hover,
        'md-state_focused': showVisualState && focusVisible,
        'md-state_pressed': showVisualState && durationPressedState,
        'md-state_disabled': props.disabled,
      },
    ]"
    :aria-label="props.tooltip"
    :aria-pressed="isToggle ? appliedSelected : undefined"
    @click="onClick"
  >
    <span class="md-icon-button__target" aria-hidden="true" />

    <MDStateLayer
      :hover="hover"
      :focused="focusVisible"
      :pressed="durationPressedState"
      :disabled="props.disabled"
    />

    <span class="md-icon-button__icon">
      <slot name="icon">
        <MDSymbol v-if="props.mdSymbolName" :name="props.mdSymbolName" />
      </slot>
    </span>

    <MDCircularProgressIndicator
      v-if="props.loading !== undefined && props.loading !== false"
      class="md-icon-button__progress-indicator"
      :progress="props.loading === true ? 0 : props.loading"
    />

    <MDRichTooltip
      v-if="slots.richTooltipContent"
      :subhead="props.tooltip"
      use-hover
      :use-click="props.showTooltipOnClick"
    >
      <template #text>
        <slot name="richTooltipContent" />
      </template>
    </MDRichTooltip>

    <MDPlainTooltip v-else :text="props.tooltip" />
  </button>
</template>

<style scoped>
.md-icon-button {
  /* No official md.comp.icon-button.*.target-size token exists; the 48dp minimum touch
     target is a project/browser accessibility implementation detail, kept private. */
  --md-private-icon-button-target-size: var(--md-icon-button-container-height);

  --md-icon-button-container-height: unset;
  --md-icon-button-container-shape: unset;
  --md-icon-button-icon-size: 24px;
  --md-icon-button-border-width: 0px;
  --md-icon-button-border-style: solid;
  --md-icon-button-leading-space: 0px;
  --md-icon-button-trailing-space: 0px;
  --md-private-icon-button-container-color: transparent;
  --md-private-icon-button-icon-color: inherit;
  --md-private-icon-button-outline-color: transparent;
  --md-private-icon-button-state-layer-color: var(--md-private-icon-button-icon-color);
  --md-private-icon-button-hover-icon-color: var(--md-private-icon-button-icon-color);
  --md-private-icon-button-focus-icon-color: var(--md-private-icon-button-icon-color);
  --md-private-icon-button-pressed-icon-color: var(--md-private-icon-button-icon-color);
  --md-private-icon-button-hover-outline-color: var(--md-private-icon-button-outline-color);
  --md-private-icon-button-focus-outline-color: var(--md-private-icon-button-outline-color);
  --md-private-icon-button-pressed-outline-color: var(--md-private-icon-button-outline-color);
  --md-private-icon-button-hover-state-layer-color: var(--md-private-icon-button-state-layer-color);
  --md-private-icon-button-focus-state-layer-color: var(--md-private-icon-button-state-layer-color);
  --md-private-icon-button-pressed-state-layer-color: var(
    --md-private-icon-button-state-layer-color
  );
  --md-private-icon-button-disabled-container-color: transparent;
  --md-private-icon-button-disabled-icon-color: var(--md-private-icon-button-icon-color);
  --md-private-icon-button-disabled-icon-opacity: 1;
  --md-private-icon-button-disabled-outline-color: var(--md-private-icon-button-outline-color);
  --md-private-icon-button-rendered-container-color: var(--md-private-icon-button-container-color);
  --md-private-icon-button-rendered-icon-color: var(--md-private-icon-button-icon-color);
  --md-private-icon-button-rendered-outline-color: var(--md-private-icon-button-outline-color);
  --md-private-icon-button-rendered-state-layer-color: var(
    --md-private-icon-button-state-layer-color
  );
  --md-private-icon-button-icon-opacity: 1;
  --md-private-state-layer-color: var(--md-private-icon-button-rendered-state-layer-color);

  position: relative;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  height: calc(var(--md-icon-button-container-height) - (var(--md-icon-button-border-width) * 2));
  padding-block: 0;
  padding-inline: calc(var(--md-icon-button-leading-space) - var(--md-icon-button-border-width))
    calc(var(--md-icon-button-trailing-space) - var(--md-icon-button-border-width));
  border-radius: var(--md-icon-button-container-shape);
  border: var(--md-icon-button-border-width) var(--md-icon-button-border-style)
    var(--md-private-icon-button-rendered-outline-color);
  box-sizing: content-box;
  background: var(--md-private-icon-button-rendered-container-color);
  color: var(--md-private-icon-button-rendered-icon-color);
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  transition-property: color, background-color, border-color, border-radius;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
  -webkit-tap-highlight-color: transparent;

  &:disabled {
    cursor: default;
  }

  &__target {
    position: absolute;
    top: 50%;
    left: 50%;
    z-index: 0;
    display: block;
    width: var(--md-private-icon-button-target-size);
    height: var(--md-private-icon-button-target-size);
    min-width: var(--md-private-icon-button-target-size);
    min-height: var(--md-private-icon-button-target-size);
    transform: translate(-50%, -50%);
    background: transparent;
  }

  &__icon {
    position: relative;
    z-index: 2;
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: var(--md-icon-button-icon-size, 1lh);
    height: var(--md-icon-button-icon-size, 1lh);
    color: rgb(
      from var(--md-private-icon-button-rendered-icon-color) r g b /
        var(--md-private-icon-button-icon-opacity)
    );
    --md-content-color: rgb(
      from var(--md-private-icon-button-rendered-icon-color) r g b /
        var(--md-private-icon-button-icon-opacity)
    );
    background: transparent;
    transition-property: opacity;
    transition-duration: var(--md-sys-motion-duration-short4, 0.2s);
    --md-symbol-size: var(--md-icon-button-icon-size);

    .md-icon-button_loading & {
      opacity: 0;
    }
  }

  &__progress-indicator {
    position: absolute;
    z-index: 2;
    width: var(--md-icon-button-icon-size, 1lh);
    height: var(--md-icon-button-icon-size, 1lh);
    --md-circular-progress-color: rgb(
      from var(--md-private-icon-button-rendered-icon-color) r g b /
        var(--md-private-icon-button-icon-opacity)
    );
  }

  &_color-filled {
    --md-comp-icon-button-filled-container-color: var(--md-sys-color-primary);
    --md-comp-icon-button-filled-icon-color: var(--md-sys-color-on-primary);
    --md-comp-icon-button-filled-hovered-icon-color: var(--md-sys-color-on-primary);
    --md-comp-icon-button-filled-focused-icon-color: var(--md-sys-color-on-primary);
    --md-comp-icon-button-filled-pressed-icon-color: var(--md-sys-color-on-primary);
    --md-comp-icon-button-filled-hovered-state-layer-color: var(--md-sys-color-on-primary);
    --md-comp-icon-button-filled-focused-state-layer-color: var(--md-sys-color-on-primary);
    --md-comp-icon-button-filled-pressed-state-layer-color: var(--md-sys-color-on-primary);
    --md-comp-icon-button-filled-hovered-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity
    );
    --md-comp-icon-button-filled-focused-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity
    );
    --md-comp-icon-button-filled-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity
    );
    --md-comp-icon-button-filled-disabled-container-color: var(--md-sys-color-on-surface);
    --md-comp-icon-button-filled-disabled-container-opacity: 0.1;
    --md-comp-icon-button-filled-disabled-icon-color: var(--md-sys-color-on-surface);
    --md-comp-icon-button-filled-disabled-icon-opacity: 0.38;

    --md-private-icon-button-container-color: var(--md-comp-icon-button-filled-container-color);
    --md-private-icon-button-icon-color: var(--md-comp-icon-button-filled-icon-color);
    --md-private-icon-button-hover-icon-color: var(--md-comp-icon-button-filled-hovered-icon-color);
    --md-private-icon-button-focus-icon-color: var(--md-comp-icon-button-filled-focused-icon-color);
    --md-private-icon-button-pressed-icon-color: var(
      --md-comp-icon-button-filled-pressed-icon-color
    );
    --md-private-icon-button-hover-state-layer-color: var(
      --md-comp-icon-button-filled-hovered-state-layer-color
    );
    --md-private-icon-button-focus-state-layer-color: var(
      --md-comp-icon-button-filled-focused-state-layer-color
    );
    --md-private-icon-button-pressed-state-layer-color: var(
      --md-comp-icon-button-filled-pressed-state-layer-color
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-icon-button-filled-hovered-state-layer-opacity
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-icon-button-filled-focused-state-layer-opacity
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-icon-button-filled-pressed-state-layer-opacity
    );
    --md-private-icon-button-disabled-container-color: rgb(
      from var(--md-comp-icon-button-filled-disabled-container-color) r g b /
        var(--md-comp-icon-button-filled-disabled-container-opacity)
    );
    --md-private-icon-button-disabled-icon-color: var(
      --md-comp-icon-button-filled-disabled-icon-color
    );
    --md-private-icon-button-disabled-icon-opacity: var(
      --md-comp-icon-button-filled-disabled-icon-opacity
    );
    --md-symbol-fill: 1;

    &.md-icon-button_variant-toggle {
      --md-comp-icon-button-filled-unselected-container-color: var(
        --md-sys-color-surface-container
      );
      --md-comp-icon-button-filled-unselected-icon-color: var(--md-sys-color-on-surface-variant);
      --md-comp-icon-button-filled-unselected-hovered-icon-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-filled-unselected-focused-icon-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-filled-unselected-pressed-icon-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-filled-unselected-hovered-state-layer-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-filled-unselected-focused-state-layer-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-filled-unselected-pressed-state-layer-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-private-icon-button-container-color: var(
        --md-comp-icon-button-filled-unselected-container-color
      );
      --md-private-icon-button-icon-color: var(--md-comp-icon-button-filled-unselected-icon-color);
      --md-private-icon-button-hover-icon-color: var(
        --md-comp-icon-button-filled-unselected-hovered-icon-color
      );
      --md-private-icon-button-focus-icon-color: var(
        --md-comp-icon-button-filled-unselected-focused-icon-color
      );
      --md-private-icon-button-pressed-icon-color: var(
        --md-comp-icon-button-filled-unselected-pressed-icon-color
      );
      --md-private-icon-button-hover-state-layer-color: var(
        --md-comp-icon-button-filled-unselected-hovered-state-layer-color
      );
      --md-private-icon-button-focus-state-layer-color: var(
        --md-comp-icon-button-filled-unselected-focused-state-layer-color
      );
      --md-private-icon-button-pressed-state-layer-color: var(
        --md-comp-icon-button-filled-unselected-pressed-state-layer-color
      );
      --md-symbol-fill: 0;

      &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
        --md-comp-icon-button-filled-selected-container-color: var(--md-sys-color-primary);
        --md-comp-icon-button-filled-selected-icon-color: var(--md-sys-color-on-primary);
        --md-comp-icon-button-filled-selected-hovered-icon-color: var(--md-sys-color-on-primary);
        --md-comp-icon-button-filled-selected-focused-icon-color: var(--md-sys-color-on-primary);
        --md-comp-icon-button-filled-selected-pressed-icon-color: var(--md-sys-color-on-primary);
        --md-comp-icon-button-filled-selected-hovered-state-layer-color: var(
          --md-sys-color-on-primary
        );
        --md-comp-icon-button-filled-selected-focused-state-layer-color: var(
          --md-sys-color-on-primary
        );
        --md-comp-icon-button-filled-selected-pressed-state-layer-color: var(
          --md-sys-color-on-primary
        );
        --md-private-icon-button-container-color: var(
          --md-comp-icon-button-filled-selected-container-color
        );
        --md-private-icon-button-icon-color: var(--md-comp-icon-button-filled-selected-icon-color);
        --md-private-icon-button-hover-icon-color: var(
          --md-comp-icon-button-filled-selected-hovered-icon-color
        );
        --md-private-icon-button-focus-icon-color: var(
          --md-comp-icon-button-filled-selected-focused-icon-color
        );
        --md-private-icon-button-pressed-icon-color: var(
          --md-comp-icon-button-filled-selected-pressed-icon-color
        );
        --md-private-icon-button-hover-state-layer-color: var(
          --md-comp-icon-button-filled-selected-hovered-state-layer-color
        );
        --md-private-icon-button-focus-state-layer-color: var(
          --md-comp-icon-button-filled-selected-focused-state-layer-color
        );
        --md-private-icon-button-pressed-state-layer-color: var(
          --md-comp-icon-button-filled-selected-pressed-state-layer-color
        );
        --md-symbol-fill: 1;
      }
    }
  }

  &_color-tonal {
    --md-comp-icon-button-tonal-container-color: var(--md-sys-color-secondary-container);
    --md-comp-icon-button-tonal-icon-color: var(--md-sys-color-on-secondary-container);
    --md-comp-icon-button-tonal-hovered-icon-color: var(--md-sys-color-on-secondary-container);
    --md-comp-icon-button-tonal-focused-icon-color: var(--md-sys-color-on-secondary-container);
    --md-comp-icon-button-tonal-pressed-icon-color: var(--md-sys-color-on-secondary-container);
    --md-comp-icon-button-tonal-hovered-state-layer-color: var(
      --md-sys-color-on-secondary-container
    );
    --md-comp-icon-button-tonal-focused-state-layer-color: var(
      --md-sys-color-on-secondary-container
    );
    --md-comp-icon-button-tonal-pressed-state-layer-color: var(
      --md-sys-color-on-secondary-container
    );
    --md-comp-icon-button-tonal-hovered-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity
    );
    --md-comp-icon-button-tonal-focused-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity
    );
    --md-comp-icon-button-tonal-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity
    );
    --md-comp-icon-button-tonal-disabled-container-color: var(--md-sys-color-on-surface);
    --md-comp-icon-button-tonal-disabled-container-opacity: 0.12;
    --md-comp-icon-button-tonal-disabled-icon-color: var(--md-sys-color-on-surface);
    --md-comp-icon-button-tonal-disabled-icon-opacity: 0.38;

    --md-private-icon-button-container-color: var(--md-comp-icon-button-tonal-container-color);
    --md-private-icon-button-icon-color: var(--md-comp-icon-button-tonal-icon-color);
    --md-private-icon-button-hover-icon-color: var(--md-comp-icon-button-tonal-hovered-icon-color);
    --md-private-icon-button-focus-icon-color: var(--md-comp-icon-button-tonal-focused-icon-color);
    --md-private-icon-button-pressed-icon-color: var(
      --md-comp-icon-button-tonal-pressed-icon-color
    );
    --md-private-icon-button-hover-state-layer-color: var(
      --md-comp-icon-button-tonal-hovered-state-layer-color
    );
    --md-private-icon-button-focus-state-layer-color: var(
      --md-comp-icon-button-tonal-focused-state-layer-color
    );
    --md-private-icon-button-pressed-state-layer-color: var(
      --md-comp-icon-button-tonal-pressed-state-layer-color
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-icon-button-tonal-hovered-state-layer-opacity
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-icon-button-tonal-focused-state-layer-opacity
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-icon-button-tonal-pressed-state-layer-opacity
    );
    --md-private-icon-button-disabled-container-color: rgb(
      from var(--md-comp-icon-button-tonal-disabled-container-color) r g b /
        var(--md-comp-icon-button-tonal-disabled-container-opacity)
    );
    --md-private-icon-button-disabled-icon-color: var(
      --md-comp-icon-button-tonal-disabled-icon-color
    );
    --md-private-icon-button-disabled-icon-opacity: var(
      --md-comp-icon-button-tonal-disabled-icon-opacity
    );
    --md-symbol-fill: 1;

    &.md-icon-button_variant-toggle {
      --md-comp-icon-button-tonal-unselected-container-color: var(
        --md-sys-color-secondary-container
      );
      --md-comp-icon-button-tonal-unselected-icon-color: var(--md-sys-color-on-secondary-container);
      --md-comp-icon-button-tonal-unselected-hovered-icon-color: var(
        --md-sys-color-on-secondary-container
      );
      --md-comp-icon-button-tonal-unselected-focused-icon-color: var(
        --md-sys-color-on-secondary-container
      );
      --md-comp-icon-button-tonal-unselected-pressed-icon-color: var(
        --md-sys-color-on-secondary-container
      );
      --md-comp-icon-button-tonal-unselected-hovered-state-layer-color: var(
        --md-sys-color-on-secondary-container
      );
      --md-comp-icon-button-tonal-unselected-focused-state-layer-color: var(
        --md-sys-color-on-secondary-container
      );
      --md-comp-icon-button-tonal-unselected-pressed-state-layer-color: var(
        --md-sys-color-on-secondary-container
      );
      --md-private-icon-button-container-color: var(
        --md-comp-icon-button-tonal-unselected-container-color
      );
      --md-private-icon-button-icon-color: var(--md-comp-icon-button-tonal-unselected-icon-color);
      --md-private-icon-button-hover-icon-color: var(
        --md-comp-icon-button-tonal-unselected-hovered-icon-color
      );
      --md-private-icon-button-focus-icon-color: var(
        --md-comp-icon-button-tonal-unselected-focused-icon-color
      );
      --md-private-icon-button-pressed-icon-color: var(
        --md-comp-icon-button-tonal-unselected-pressed-icon-color
      );
      --md-private-icon-button-hover-state-layer-color: var(
        --md-comp-icon-button-tonal-unselected-hovered-state-layer-color
      );
      --md-private-icon-button-focus-state-layer-color: var(
        --md-comp-icon-button-tonal-unselected-focused-state-layer-color
      );
      --md-private-icon-button-pressed-state-layer-color: var(
        --md-comp-icon-button-tonal-unselected-pressed-state-layer-color
      );
      --md-symbol-fill: 0;

      &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
        --md-comp-icon-button-tonal-selected-container-color: var(--md-sys-color-secondary);
        --md-comp-icon-button-tonal-selected-icon-color: var(--md-sys-color-on-secondary);
        --md-comp-icon-button-tonal-selected-hovered-icon-color: var(--md-sys-color-on-secondary);
        --md-comp-icon-button-tonal-selected-focused-icon-color: var(--md-sys-color-on-secondary);
        --md-comp-icon-button-tonal-selected-pressed-icon-color: var(--md-sys-color-on-secondary);
        --md-comp-icon-button-tonal-selected-hovered-state-layer-color: var(
          --md-sys-color-on-secondary
        );
        --md-comp-icon-button-tonal-selected-focused-state-layer-color: var(
          --md-sys-color-on-secondary
        );
        --md-comp-icon-button-tonal-selected-pressed-state-layer-color: var(
          --md-sys-color-on-secondary
        );
        --md-private-icon-button-container-color: var(
          --md-comp-icon-button-tonal-selected-container-color
        );
        --md-private-icon-button-icon-color: var(--md-comp-icon-button-tonal-selected-icon-color);
        --md-private-icon-button-hover-icon-color: var(
          --md-comp-icon-button-tonal-selected-hovered-icon-color
        );
        --md-private-icon-button-focus-icon-color: var(
          --md-comp-icon-button-tonal-selected-focused-icon-color
        );
        --md-private-icon-button-pressed-icon-color: var(
          --md-comp-icon-button-tonal-selected-pressed-icon-color
        );
        --md-private-icon-button-hover-state-layer-color: var(
          --md-comp-icon-button-tonal-selected-hovered-state-layer-color
        );
        --md-private-icon-button-focus-state-layer-color: var(
          --md-comp-icon-button-tonal-selected-focused-state-layer-color
        );
        --md-private-icon-button-pressed-state-layer-color: var(
          --md-comp-icon-button-tonal-selected-pressed-state-layer-color
        );
        --md-symbol-fill: 1;
      }
    }
  }

  &_color-outlined {
    --md-comp-icon-button-outlined-outline-color: var(--md-sys-color-outline-variant);
    --md-comp-icon-button-outlined-icon-color: var(--md-sys-color-on-surface-variant);
    --md-comp-icon-button-outlined-hovered-icon-color: var(--md-sys-color-on-surface-variant);
    --md-comp-icon-button-outlined-focused-icon-color: var(--md-sys-color-on-surface-variant);
    --md-comp-icon-button-outlined-pressed-icon-color: var(--md-sys-color-on-surface-variant);
    --md-comp-icon-button-outlined-hovered-state-layer-color: var(
      --md-sys-color-on-surface-variant
    );
    --md-comp-icon-button-outlined-focused-state-layer-color: var(
      --md-sys-color-on-surface-variant
    );
    --md-comp-icon-button-outlined-pressed-state-layer-color: var(
      --md-sys-color-on-surface-variant
    );
    --md-comp-icon-button-outlined-disabled-outline-color: var(--md-sys-color-outline-variant);
    --md-comp-icon-button-outlined-hovered-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity
    );
    --md-comp-icon-button-outlined-focused-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity
    );
    --md-comp-icon-button-outlined-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity
    );
    --md-comp-icon-button-outlined-disabled-icon-color: var(--md-sys-color-on-surface);
    --md-comp-icon-button-outlined-disabled-icon-opacity: 0.38;

    --md-private-icon-button-icon-color: var(--md-comp-icon-button-outlined-icon-color);
    --md-private-icon-button-outline-color: var(--md-comp-icon-button-outlined-outline-color);
    --md-private-icon-button-hover-icon-color: var(
      --md-comp-icon-button-outlined-hovered-icon-color
    );
    --md-private-icon-button-focus-icon-color: var(
      --md-comp-icon-button-outlined-focused-icon-color
    );
    --md-private-icon-button-pressed-icon-color: var(
      --md-comp-icon-button-outlined-pressed-icon-color
    );
    --md-private-icon-button-hover-outline-color: var(--md-comp-icon-button-outlined-outline-color);
    --md-private-icon-button-focus-outline-color: var(--md-comp-icon-button-outlined-outline-color);
    --md-private-icon-button-pressed-outline-color: var(
      --md-comp-icon-button-outlined-outline-color
    );
    --md-private-icon-button-hover-state-layer-color: var(
      --md-comp-icon-button-outlined-hovered-state-layer-color
    );
    --md-private-icon-button-focus-state-layer-color: var(
      --md-comp-icon-button-outlined-focused-state-layer-color
    );
    --md-private-icon-button-pressed-state-layer-color: var(
      --md-comp-icon-button-outlined-pressed-state-layer-color
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-icon-button-outlined-hovered-state-layer-opacity
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-icon-button-outlined-focused-state-layer-opacity
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-icon-button-outlined-pressed-state-layer-opacity
    );
    --md-private-icon-button-disabled-icon-color: var(
      --md-comp-icon-button-outlined-disabled-icon-color
    );
    --md-private-icon-button-disabled-icon-opacity: var(
      --md-comp-icon-button-outlined-disabled-icon-opacity
    );
    --md-private-icon-button-disabled-outline-color: var(
      --md-comp-icon-button-outlined-disabled-outline-color
    );
    --md-symbol-fill: 1;

    &.md-icon-button_variant-toggle {
      --md-comp-icon-button-outlined-unselected-outline-color: var(--md-sys-color-outline-variant);
      --md-comp-icon-button-outlined-unselected-icon-color: var(--md-sys-color-on-surface-variant);
      --md-comp-icon-button-outlined-unselected-hovered-icon-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-outlined-unselected-focused-icon-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-outlined-unselected-pressed-icon-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-outlined-unselected-hovered-state-layer-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-outlined-unselected-focused-state-layer-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-outlined-unselected-pressed-state-layer-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-private-icon-button-icon-color: var(
        --md-comp-icon-button-outlined-unselected-icon-color
      );
      --md-private-icon-button-outline-color: var(
        --md-comp-icon-button-outlined-unselected-outline-color
      );
      --md-private-icon-button-hover-icon-color: var(
        --md-comp-icon-button-outlined-unselected-hovered-icon-color
      );
      --md-private-icon-button-focus-icon-color: var(
        --md-comp-icon-button-outlined-unselected-focused-icon-color
      );
      --md-private-icon-button-pressed-icon-color: var(
        --md-comp-icon-button-outlined-unselected-pressed-icon-color
      );
      --md-private-icon-button-hover-state-layer-color: var(
        --md-comp-icon-button-outlined-unselected-hovered-state-layer-color
      );
      --md-private-icon-button-focus-state-layer-color: var(
        --md-comp-icon-button-outlined-unselected-focused-state-layer-color
      );
      --md-private-icon-button-pressed-state-layer-color: var(
        --md-comp-icon-button-outlined-unselected-pressed-state-layer-color
      );
      --md-symbol-fill: 0;

      &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
        --md-comp-icon-button-outlined-selected-container-color: var(
          --md-sys-color-inverse-surface
        );
        --md-comp-icon-button-outlined-selected-icon-color: var(--md-sys-color-inverse-on-surface);
        --md-comp-icon-button-outlined-selected-hovered-state-layer-color: var(
          --md-sys-color-inverse-on-surface
        );
        --md-comp-icon-button-outlined-selected-focused-state-layer-color: var(
          --md-sys-color-inverse-on-surface
        );
        --md-comp-icon-button-outlined-selected-pressed-state-layer-color: var(
          --md-sys-color-inverse-on-surface
        );
        --md-private-icon-button-container-color: var(
          --md-comp-icon-button-outlined-selected-container-color
        );
        --md-private-icon-button-icon-color: var(
          --md-comp-icon-button-outlined-selected-icon-color
        );
        --md-private-icon-button-outline-color: var(
          --md-comp-icon-button-outlined-selected-container-color
        );
        --md-private-icon-button-hover-icon-color: var(
          --md-comp-icon-button-outlined-selected-icon-color
        );
        --md-private-icon-button-focus-icon-color: var(
          --md-comp-icon-button-outlined-selected-icon-color
        );
        --md-private-icon-button-pressed-icon-color: var(
          --md-comp-icon-button-outlined-selected-icon-color
        );
        --md-private-icon-button-hover-state-layer-color: var(
          --md-comp-icon-button-outlined-selected-hovered-state-layer-color
        );
        --md-private-icon-button-focus-state-layer-color: var(
          --md-comp-icon-button-outlined-selected-focused-state-layer-color
        );
        --md-private-icon-button-pressed-state-layer-color: var(
          --md-comp-icon-button-outlined-selected-pressed-state-layer-color
        );
        --md-symbol-fill: 1;
      }
    }
  }

  &_color-standard {
    --md-comp-icon-button-standard-icon-color: var(--md-sys-color-on-surface-variant);
    --md-comp-icon-button-standard-hovered-icon-color: var(--md-sys-color-on-surface-variant);
    --md-comp-icon-button-standard-focused-icon-color: var(--md-sys-color-on-surface-variant);
    --md-comp-icon-button-standard-pressed-icon-color: var(--md-sys-color-on-surface-variant);
    --md-comp-icon-button-standard-hovered-state-layer-color: var(
      --md-sys-color-on-surface-variant
    );
    --md-comp-icon-button-standard-focused-state-layer-color: var(
      --md-sys-color-on-surface-variant
    );
    --md-comp-icon-button-standard-pressed-state-layer-color: var(
      --md-sys-color-on-surface-variant
    );
    --md-comp-icon-button-standard-hovered-state-layer-opacity: var(
      --md-sys-state-hover-state-layer-opacity
    );
    --md-comp-icon-button-standard-focused-state-layer-opacity: var(
      --md-sys-state-focus-state-layer-opacity
    );
    --md-comp-icon-button-standard-pressed-state-layer-opacity: var(
      --md-sys-state-pressed-state-layer-opacity
    );
    --md-comp-icon-button-standard-disabled-icon-color: var(--md-sys-color-on-surface);
    --md-comp-icon-button-standard-disabled-icon-opacity: 0.38;

    --md-private-icon-button-icon-color: var(--md-comp-icon-button-standard-icon-color);
    --md-private-icon-button-hover-icon-color: var(
      --md-comp-icon-button-standard-hovered-icon-color
    );
    --md-private-icon-button-focus-icon-color: var(
      --md-comp-icon-button-standard-focused-icon-color
    );
    --md-private-icon-button-pressed-icon-color: var(
      --md-comp-icon-button-standard-pressed-icon-color
    );
    --md-private-icon-button-hover-state-layer-color: var(
      --md-comp-icon-button-standard-hovered-state-layer-color
    );
    --md-private-icon-button-focus-state-layer-color: var(
      --md-comp-icon-button-standard-focused-state-layer-color
    );
    --md-private-icon-button-pressed-state-layer-color: var(
      --md-comp-icon-button-standard-pressed-state-layer-color
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-icon-button-standard-hovered-state-layer-opacity
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-icon-button-standard-focused-state-layer-opacity
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-icon-button-standard-pressed-state-layer-opacity
    );
    --md-private-icon-button-disabled-icon-color: var(
      --md-comp-icon-button-standard-disabled-icon-color
    );
    --md-private-icon-button-disabled-icon-opacity: var(
      --md-comp-icon-button-standard-disabled-icon-opacity
    );
    --md-symbol-fill: 1;

    &.md-icon-button_variant-toggle {
      --md-comp-icon-button-standard-unselected-icon-color: var(--md-sys-color-on-surface-variant);
      --md-comp-icon-button-standard-unselected-hovered-icon-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-standard-unselected-focused-icon-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-standard-unselected-pressed-icon-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-standard-unselected-hovered-state-layer-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-standard-unselected-focused-state-layer-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-comp-icon-button-standard-unselected-pressed-state-layer-color: var(
        --md-sys-color-on-surface-variant
      );
      --md-private-icon-button-icon-color: var(
        --md-comp-icon-button-standard-unselected-icon-color
      );
      --md-private-icon-button-hover-icon-color: var(
        --md-comp-icon-button-standard-unselected-hovered-icon-color
      );
      --md-private-icon-button-focus-icon-color: var(
        --md-comp-icon-button-standard-unselected-focused-icon-color
      );
      --md-private-icon-button-pressed-icon-color: var(
        --md-comp-icon-button-standard-unselected-pressed-icon-color
      );
      --md-private-icon-button-hover-state-layer-color: var(
        --md-comp-icon-button-standard-unselected-hovered-state-layer-color
      );
      --md-private-icon-button-focus-state-layer-color: var(
        --md-comp-icon-button-standard-unselected-focused-state-layer-color
      );
      --md-private-icon-button-pressed-state-layer-color: var(
        --md-comp-icon-button-standard-unselected-pressed-state-layer-color
      );
      --md-symbol-fill: 0;

      &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
        --md-comp-icon-button-standard-selected-icon-color: var(--md-sys-color-primary);
        --md-comp-icon-button-standard-selected-hovered-icon-color: var(--md-sys-color-primary);
        --md-comp-icon-button-standard-selected-focused-icon-color: var(--md-sys-color-primary);
        --md-comp-icon-button-standard-selected-pressed-icon-color: var(--md-sys-color-primary);
        --md-comp-icon-button-standard-selected-hovered-state-layer-color: var(
          --md-sys-color-primary
        );
        --md-comp-icon-button-standard-selected-focused-state-layer-color: var(
          --md-sys-color-primary
        );
        --md-comp-icon-button-standard-selected-pressed-state-layer-color: var(
          --md-sys-color-primary
        );
        --md-private-icon-button-icon-color: var(
          --md-comp-icon-button-standard-selected-icon-color
        );
        --md-private-icon-button-hover-icon-color: var(
          --md-comp-icon-button-standard-selected-hovered-icon-color
        );
        --md-private-icon-button-focus-icon-color: var(
          --md-comp-icon-button-standard-selected-focused-icon-color
        );
        --md-private-icon-button-pressed-icon-color: var(
          --md-comp-icon-button-standard-selected-pressed-icon-color
        );
        --md-private-icon-button-hover-state-layer-color: var(
          --md-comp-icon-button-standard-selected-hovered-state-layer-color
        );
        --md-private-icon-button-focus-state-layer-color: var(
          --md-comp-icon-button-standard-selected-focused-state-layer-color
        );
        --md-private-icon-button-pressed-state-layer-color: var(
          --md-comp-icon-button-standard-selected-pressed-state-layer-color
        );
        --md-symbol-fill: 1;
      }
    }
  }

  &_size {
    /* Public size prop values keep the project's extra-small/extra-large naming;
       the official token path segments (md.comp.icon-button.xsmall/xlarge.*) are
       used for the --md-comp-icon-button-* custom property names below. */
    &-extra-small {
      --md-comp-icon-button-xsmall-container-height: 32dp;
      --md-comp-icon-button-xsmall-icon-size: 20dp;
      --md-comp-icon-button-xsmall-default-leading-space: 6dp;
      --md-comp-icon-button-xsmall-default-trailing-space: 6dp;
      --md-comp-icon-button-xsmall-narrow-leading-space: 4dp;
      --md-comp-icon-button-xsmall-narrow-trailing-space: 4dp;
      --md-comp-icon-button-xsmall-wide-leading-space: 10dp;
      --md-comp-icon-button-xsmall-wide-trailing-space: 10dp;
      --md-comp-icon-button-xsmall-container-shape-round: var(--md-sys-shape-corner-full);
      --md-comp-icon-button-xsmall-container-shape-square: var(--md-sys-shape-corner-medium);
      --md-comp-icon-button-xsmall-pressed-container-shape: var(--md-sys-shape-corner-small);
      --md-comp-icon-button-xsmall-selected-container-shape-round: var(
        --md-sys-shape-corner-medium
      );
      --md-comp-icon-button-xsmall-selected-container-shape-square: var(--md-sys-shape-corner-full);
      --md-comp-icon-button-xsmall-outlined-outline-width: 1dp;

      --md-icon-button-container-height: var(--md-comp-icon-button-xsmall-container-height);
      --md-icon-button-icon-size: var(--md-comp-icon-button-xsmall-icon-size);
      --md-private-icon-button-target-size: 48dp;

      &.md-icon-button_color-outlined {
        --md-icon-button-border-width: var(--md-comp-icon-button-xsmall-outlined-outline-width);
      }

      &.md-icon-button_width-narrow {
        --md-icon-button-leading-space: var(--md-comp-icon-button-xsmall-narrow-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-xsmall-narrow-trailing-space);
      }
      &.md-icon-button_width-default {
        --md-icon-button-leading-space: var(--md-comp-icon-button-xsmall-default-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-xsmall-default-trailing-space);
      }
      &.md-icon-button_width-wide {
        --md-icon-button-leading-space: var(--md-comp-icon-button-xsmall-wide-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-xsmall-wide-trailing-space);
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: var(--md-comp-icon-button-xsmall-container-shape-round);

        &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
          --md-icon-button-container-shape: var(
            --md-comp-icon-button-xsmall-selected-container-shape-round
          );
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-comp-icon-button-xsmall-container-shape-square);

        &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
          --md-icon-button-container-shape: var(
            --md-comp-icon-button-xsmall-selected-container-shape-square
          );
        }
      }
      &.md-state_pressed:not(.md-state_disabled):not(:disabled) {
        --md-icon-button-container-shape: var(--md-comp-icon-button-xsmall-pressed-container-shape);
      }
    }
    &-small {
      --md-comp-icon-button-small-container-height: 40dp;
      --md-comp-icon-button-small-icon-size: 24dp;
      --md-comp-icon-button-small-default-leading-space: 8dp;
      --md-comp-icon-button-small-default-trailing-space: 8dp;
      --md-comp-icon-button-small-narrow-leading-space: 4dp;
      --md-comp-icon-button-small-narrow-trailing-space: 4dp;
      --md-comp-icon-button-small-wide-leading-space: 14dp;
      --md-comp-icon-button-small-wide-trailing-space: 14dp;
      --md-comp-icon-button-small-container-shape-round: var(--md-sys-shape-corner-full);
      --md-comp-icon-button-small-container-shape-square: var(--md-sys-shape-corner-medium);
      --md-comp-icon-button-small-pressed-container-shape: var(--md-sys-shape-corner-small);
      --md-comp-icon-button-small-selected-container-shape-round: var(--md-sys-shape-corner-medium);
      --md-comp-icon-button-small-selected-container-shape-square: var(--md-sys-shape-corner-full);
      --md-comp-icon-button-small-outlined-outline-width: 1dp;

      --md-icon-button-container-height: var(--md-comp-icon-button-small-container-height);
      --md-icon-button-icon-size: var(--md-comp-icon-button-small-icon-size);
      --md-private-icon-button-target-size: 48dp;

      &.md-icon-button_color-outlined {
        --md-icon-button-border-width: var(--md-comp-icon-button-small-outlined-outline-width);
      }

      &.md-icon-button_width-narrow {
        --md-icon-button-leading-space: var(--md-comp-icon-button-small-narrow-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-small-narrow-trailing-space);
      }
      &.md-icon-button_width-default {
        --md-icon-button-leading-space: var(--md-comp-icon-button-small-default-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-small-default-trailing-space);
      }
      &.md-icon-button_width-wide {
        --md-icon-button-leading-space: var(--md-comp-icon-button-small-wide-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-small-wide-trailing-space);
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: var(--md-comp-icon-button-small-container-shape-round);

        &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
          --md-icon-button-container-shape: var(
            --md-comp-icon-button-small-selected-container-shape-round
          );
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-comp-icon-button-small-container-shape-square);

        &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
          --md-icon-button-container-shape: var(
            --md-comp-icon-button-small-selected-container-shape-square
          );
        }
      }
      &.md-state_pressed:not(.md-state_disabled):not(:disabled) {
        --md-icon-button-container-shape: var(--md-comp-icon-button-small-pressed-container-shape);
      }
    }
    &-medium {
      --md-comp-icon-button-medium-container-height: 56dp;
      --md-comp-icon-button-medium-icon-size: 24dp;
      --md-comp-icon-button-medium-default-leading-space: 16dp;
      --md-comp-icon-button-medium-default-trailing-space: 16dp;
      --md-comp-icon-button-medium-narrow-leading-space: 12dp;
      --md-comp-icon-button-medium-narrow-trailing-space: 12dp;
      --md-comp-icon-button-medium-wide-leading-space: 24dp;
      --md-comp-icon-button-medium-wide-trailing-space: 24dp;
      --md-comp-icon-button-medium-container-shape-round: var(--md-sys-shape-corner-full);
      --md-comp-icon-button-medium-container-shape-square: var(--md-sys-shape-corner-large);
      --md-comp-icon-button-medium-pressed-container-shape: var(--md-sys-shape-corner-medium);
      --md-comp-icon-button-medium-selected-container-shape-round: var(--md-sys-shape-corner-large);
      --md-comp-icon-button-medium-selected-container-shape-square: var(--md-sys-shape-corner-full);
      --md-comp-icon-button-medium-outlined-outline-width: 1dp;

      --md-icon-button-container-height: var(--md-comp-icon-button-medium-container-height);
      --md-icon-button-icon-size: var(--md-comp-icon-button-medium-icon-size);

      &.md-icon-button_color-outlined {
        --md-icon-button-border-width: var(--md-comp-icon-button-medium-outlined-outline-width);
      }

      &.md-icon-button_width-narrow {
        --md-icon-button-leading-space: var(--md-comp-icon-button-medium-narrow-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-medium-narrow-trailing-space);
      }
      &.md-icon-button_width-default {
        --md-icon-button-leading-space: var(--md-comp-icon-button-medium-default-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-medium-default-trailing-space);
      }
      &.md-icon-button_width-wide {
        --md-icon-button-leading-space: var(--md-comp-icon-button-medium-wide-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-medium-wide-trailing-space);
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: var(--md-comp-icon-button-medium-container-shape-round);

        &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
          --md-icon-button-container-shape: var(
            --md-comp-icon-button-medium-selected-container-shape-round
          );
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-comp-icon-button-medium-container-shape-square);

        &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
          --md-icon-button-container-shape: var(
            --md-comp-icon-button-medium-selected-container-shape-square
          );
        }
      }
      &.md-state_pressed:not(.md-state_disabled):not(:disabled) {
        --md-icon-button-container-shape: var(--md-comp-icon-button-medium-pressed-container-shape);
      }
    }
    &-large {
      --md-comp-icon-button-large-container-height: 96dp;
      --md-comp-icon-button-large-icon-size: 32dp;
      --md-comp-icon-button-large-default-leading-space: 32dp;
      --md-comp-icon-button-large-default-trailing-space: 32dp;
      --md-comp-icon-button-large-narrow-leading-space: 16dp;
      --md-comp-icon-button-large-narrow-trailing-space: 16dp;
      --md-comp-icon-button-large-wide-leading-space: 48dp;
      --md-comp-icon-button-large-wide-trailing-space: 48dp;
      --md-comp-icon-button-large-container-shape-round: var(--md-sys-shape-corner-full);
      --md-comp-icon-button-large-container-shape-square: var(--md-sys-shape-corner-extra-large);
      --md-comp-icon-button-large-pressed-container-shape: var(--md-sys-shape-corner-large);
      --md-comp-icon-button-large-selected-container-shape-round: var(
        --md-sys-shape-corner-extra-large
      );
      --md-comp-icon-button-large-selected-container-shape-square: var(--md-sys-shape-corner-full);
      --md-comp-icon-button-large-outlined-outline-width: 2dp;

      --md-icon-button-container-height: var(--md-comp-icon-button-large-container-height);
      --md-icon-button-icon-size: var(--md-comp-icon-button-large-icon-size);

      &.md-icon-button_color-outlined {
        --md-icon-button-border-width: var(--md-comp-icon-button-large-outlined-outline-width);
      }

      &.md-icon-button_width-narrow {
        --md-icon-button-leading-space: var(--md-comp-icon-button-large-narrow-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-large-narrow-trailing-space);
      }
      &.md-icon-button_width-default {
        --md-icon-button-leading-space: var(--md-comp-icon-button-large-default-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-large-default-trailing-space);
      }
      &.md-icon-button_width-wide {
        --md-icon-button-leading-space: var(--md-comp-icon-button-large-wide-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-large-wide-trailing-space);
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: var(--md-comp-icon-button-large-container-shape-round);

        &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
          --md-icon-button-container-shape: var(
            --md-comp-icon-button-large-selected-container-shape-round
          );
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-comp-icon-button-large-container-shape-square);

        &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
          --md-icon-button-container-shape: var(
            --md-comp-icon-button-large-selected-container-shape-square
          );
        }
      }
      &.md-state_pressed:not(.md-state_disabled):not(:disabled) {
        --md-icon-button-container-shape: var(--md-comp-icon-button-large-pressed-container-shape);
      }
    }
    &-extra-large {
      --md-comp-icon-button-xlarge-container-height: 136dp;
      --md-comp-icon-button-xlarge-icon-size: 40dp;
      --md-comp-icon-button-xlarge-default-leading-space: 48dp;
      --md-comp-icon-button-xlarge-default-trailing-space: 48dp;
      --md-comp-icon-button-xlarge-narrow-leading-space: 32dp;
      --md-comp-icon-button-xlarge-narrow-trailing-space: 32dp;
      --md-comp-icon-button-xlarge-wide-leading-space: 72dp;
      --md-comp-icon-button-xlarge-wide-trailing-space: 72dp;
      --md-comp-icon-button-xlarge-container-shape-round: var(--md-sys-shape-corner-full);
      --md-comp-icon-button-xlarge-container-shape-square: var(--md-sys-shape-corner-extra-large);
      --md-comp-icon-button-xlarge-pressed-container-shape: var(--md-sys-shape-corner-large);
      --md-comp-icon-button-xlarge-selected-container-shape-round: var(
        --md-sys-shape-corner-extra-large
      );
      --md-comp-icon-button-xlarge-selected-container-shape-square: var(--md-sys-shape-corner-full);
      --md-comp-icon-button-xlarge-outlined-outline-width: 3dp;

      --md-icon-button-container-height: var(--md-comp-icon-button-xlarge-container-height);
      --md-icon-button-icon-size: var(--md-comp-icon-button-xlarge-icon-size);

      &.md-icon-button_color-outlined {
        --md-icon-button-border-width: var(--md-comp-icon-button-xlarge-outlined-outline-width);
      }

      &.md-icon-button_width-narrow {
        --md-icon-button-leading-space: var(--md-comp-icon-button-xlarge-narrow-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-xlarge-narrow-trailing-space);
      }
      &.md-icon-button_width-default {
        --md-icon-button-leading-space: var(--md-comp-icon-button-xlarge-default-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-xlarge-default-trailing-space);
      }
      &.md-icon-button_width-wide {
        --md-icon-button-leading-space: var(--md-comp-icon-button-xlarge-wide-leading-space);
        --md-icon-button-trailing-space: var(--md-comp-icon-button-xlarge-wide-trailing-space);
      }

      &.md-icon-button_shape-round {
        --md-icon-button-container-shape: var(--md-comp-icon-button-xlarge-container-shape-round);

        &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
          --md-icon-button-container-shape: var(
            --md-comp-icon-button-xlarge-selected-container-shape-round
          );
        }
      }
      &.md-icon-button_shape-square {
        --md-icon-button-container-shape: var(--md-comp-icon-button-xlarge-container-shape-square);

        &.md-icon-button_selected:not(.md-state_disabled):not(:disabled) {
          --md-icon-button-container-shape: var(
            --md-comp-icon-button-xlarge-selected-container-shape-square
          );
        }
      }
      &.md-state_pressed:not(.md-state_disabled):not(:disabled) {
        --md-icon-button-container-shape: var(--md-comp-icon-button-xlarge-pressed-container-shape);
      }
    }
  }

  &.md-state_hover:not(.md-state_disabled):not(:disabled),
  &:hover:not(:disabled) {
    --md-private-icon-button-rendered-icon-color: var(
      --md-private-icon-button-hover-icon-color,
      var(--md-private-icon-button-icon-color)
    );
    --md-private-icon-button-rendered-outline-color: var(
      --md-private-icon-button-hover-outline-color,
      var(--md-private-icon-button-outline-color)
    );
    --md-private-icon-button-rendered-state-layer-color: var(
      --md-private-icon-button-hover-state-layer-color,
      var(--md-private-icon-button-state-layer-color)
    );
    --md-private-icon-button-icon-opacity: 1;
  }

  &.md-state_focused:not(.md-state_disabled):not(:disabled),
  &:focus-visible:not(:disabled) {
    --md-private-icon-button-rendered-icon-color: var(
      --md-private-icon-button-focus-icon-color,
      var(--md-private-icon-button-icon-color)
    );
    --md-private-icon-button-rendered-outline-color: var(
      --md-private-icon-button-focus-outline-color,
      var(--md-private-icon-button-outline-color)
    );
    --md-private-icon-button-rendered-state-layer-color: var(
      --md-private-icon-button-focus-state-layer-color,
      var(--md-private-icon-button-state-layer-color)
    );
    --md-private-icon-button-icon-opacity: 1;
  }

  &.md-state_pressed:not(.md-state_disabled):not(:disabled),
  &:active:not(:disabled) {
    --md-private-icon-button-rendered-icon-color: var(
      --md-private-icon-button-pressed-icon-color,
      var(--md-private-icon-button-icon-color)
    );
    --md-private-icon-button-rendered-outline-color: var(
      --md-private-icon-button-pressed-outline-color,
      var(--md-private-icon-button-outline-color)
    );
    --md-private-icon-button-rendered-state-layer-color: var(
      --md-private-icon-button-pressed-state-layer-color,
      var(--md-private-icon-button-state-layer-color)
    );
    --md-private-icon-button-icon-opacity: 1;
  }

  &.md-state_disabled,
  &:disabled {
    --md-private-icon-button-rendered-container-color: var(
      --md-private-icon-button-disabled-container-color,
      var(--md-private-icon-button-container-color)
    );
    --md-private-icon-button-rendered-icon-color: var(
      --md-private-icon-button-disabled-icon-color,
      var(--md-private-icon-button-icon-color)
    );
    --md-private-icon-button-rendered-outline-color: var(
      --md-private-icon-button-disabled-outline-color,
      var(--md-private-icon-button-outline-color)
    );
    --md-private-icon-button-rendered-state-layer-color: transparent;
    --md-private-icon-button-icon-opacity: var(--md-private-icon-button-disabled-icon-opacity, 1);
    --md-symbol-fill: 0;
  }
}
</style>
