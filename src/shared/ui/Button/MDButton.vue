<script setup lang="ts">
import { isNumber } from 'es-toolkit/compat';
import { computed, onMounted, useTemplateRef, warn, watchEffect } from 'vue';
import { MD_TYPESCALE } from '@shared/lib/md';
import { MDCircularProgressIndicator } from '../ProgressIndicators';
import { MDStateLayer, useRipple, useStateLayer } from '../State';

const props = withDefaults(
  defineProps<{
    /** Native `<button>` `type`. Defaults to `"button"` so the control never submits a form by accident. */
    nativeType?: 'button' | 'submit' | 'reset' | undefined;
    /** Material Button color style. Defaults to `"filled"`. */
    color?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text' | undefined;
    /** Visible label. Also used as the accessible name. */
    label: string;
    /** Native `disabled`. Blocks click, hover, focus, and pressed visuals; state-layer opacity forces to 0. */
    disabled?: boolean | undefined;
    /**
     * Loading state for the action. `true` shows an indeterminate progress indicator; a
     * number shows determinate progress. `0` still renders as an active loading state, but
     * the underlying `MDCircularProgressIndicator` currently renders `0` through its
     * indeterminate visual path rather than a determinate ring at zero fill.
     */
    loading?: number | boolean | undefined;
    /**
     * `"default"` is a stateless action; `"toggle"` is a controlled two-state control driven by
     * `selected`. Defaults to `"default"`. `variant="toggle"` combined with `color="text"` is
     * unsupported and normalizes to the applied `"default"` variant (dev warning).
     */
    variant?: 'default' | 'toggle' | undefined;
    /** Material Button size. Defaults to `"small"`. */
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | undefined;
    /** Container shape. Toggle variants morph to the opposite shape when selected. Defaults to `"round"`. */
    shape?: 'round' | 'square' | undefined;
    /**
     * Controlled selected state. Only applied when the applied variant is `"toggle"`; ignored
     * (with a dev warning) otherwise. `color="text"` does not support `variant="toggle"` — the
     * verified Material Button contract publishes no text toggle color route, so that
     * combination normalizes to `variant="default"` and `selected` has no effect.
     */
    selected?: boolean | undefined;
  }>(),
  {
    color: 'filled',
    nativeType: 'button',
    variant: 'default',
    size: 'small',
    shape: 'round',
  },
);

const emit = defineEmits<{
  /** Emitted from the native button click after the component's internal stopPropagation handling. */
  click: [event: MouseEvent];
}>();

const slots = defineSlots<{
  /** Leading icon content rendered before the label. */
  icon?(): unknown;
}>();

const onButtonClick = (event: MouseEvent) => {
  emit('click', event);
};

const buttonEl = useTemplateRef<HTMLButtonElement>('buttonEl');
const { hover, focused, durationPressedState } = useStateLayer(buttonEl);
const showVisualState = computed(() => !props.disabled);
/**
 * `md.comp.button` publishes no text-toggle color route (the color matrix has no text
 * selected/unselected entries), so `color="text"` + `variant="toggle"` normalizes to
 * `variant="default"`: no `aria-pressed`, no selected shape/classes, `selected` ignored.
 */
const isUnsupportedTextToggle = computed(
  () => props.color === 'text' && props.variant === 'toggle',
);
const appliedVariant = computed(() => (isUnsupportedTextToggle.value ? 'default' : props.variant));
const isToggle = computed(() => appliedVariant.value === 'toggle');
const appliedSelected = computed(() => isToggle.value && !!props.selected);

const isLoading = computed(() => props.loading !== undefined && props.loading !== false);
/**
 * `MDCircularProgressIndicator` only accepts a `[0, 1]` determinate `progress`; out-of-range or
 * non-finite numeric `loading` values are clamped to a safe determinate value instead of being
 * forwarded as-is.
 */
const normalizedLoadingProgress = computed(() => {
  if (!isNumber(props.loading)) {
    return undefined;
  }
  const value = props.loading;
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(1, Math.max(0, value));
});
const isInvalidLoadingNumber = computed(
  () =>
    isNumber(props.loading) &&
    (!Number.isFinite(props.loading) || props.loading < 0 || props.loading > 1),
);

/**
 * `md.comp.button.<size>.label-text` is a composite official token (font, weight, size,
 * line-height, tracking); the repository renders it through the shared `MD_TYPESCALE`
 * classes instead of decomposed `--md-comp-*` fragments.
 */
const labelTypescaleClass = computed(() => {
  switch (props.size) {
    case 'extra-small':
    case 'small':
      return MD_TYPESCALE.label.large;
    case 'medium':
      return MD_TYPESCALE.title.medium;
    case 'large':
      return MD_TYPESCALE.headline.small;
    case 'extra-large':
      return MD_TYPESCALE.headline.large;
    default:
      return MD_TYPESCALE.label.large;
  }
});

useRipple(computed(() => (props.disabled ? undefined : buttonEl.value)));

if (import.meta.env.DEV) {
  onMounted(() => {
    watchEffect(() => {
      if (isUnsupportedTextToggle.value) {
        warn(
          'MDButton: `color="text"` does not support `variant="toggle"` — the verified Material Button contract publishes no text toggle color route. Rendering as `variant="default"`.',
        );
      } else if (props.selected && !isToggle.value) {
        warn('MDButton: `selected` has no effect unless `variant` is "toggle".');
      }
      if (isInvalidLoadingNumber.value) {
        warn(
          `MDButton: \`loading\` numeric value ${String(props.loading)} is invalid or outside the [0, 1] range. Falling back to a clamped determinate value.`,
        );
      }
    });
  });
}
</script>

<template>
  <button
    ref="buttonEl"
    :aria-busy="isLoading ? true : undefined"
    :aria-label="props.label"
    :aria-pressed="isToggle ? appliedSelected : undefined"
    :disabled="props.disabled"
    :type="props.nativeType"
    class="md-button"
    :class="[
      `md-button_color-${props.color}`,
      `md-button_variant-${appliedVariant}`,
      `md-button_size-${props.size}`,
      `md-button_shape-${props.shape}`,
      {
        'md-button_icon': !!$slots.icon,
        'md-button_loading': isLoading,
        'md-button_selected': appliedSelected,
        'md-state_hover': showVisualState && hover,
        'md-state_focused': showVisualState && focused,
        'md-state_pressed': showVisualState && durationPressedState,
        'md-state_disabled': props.disabled,
      },
    ]"
    @click.stop="onButtonClick"
  >
    <span class="md-button__target" aria-hidden="true" />

    <MDStateLayer
      :hover="hover"
      :focused="focused"
      :pressed="durationPressedState"
      :disabled="props.disabled"
    />

    <span class="md-button__content">
      <span v-if="!!slots.icon" class="md-button__icon">
        <slot name="icon" />
      </span>

      <span v-if="props.label" class="md-button__label-text" :class="labelTypescaleClass">{{
        props.label
      }}</span>

      <MDCircularProgressIndicator
        v-if="isLoading"
        aria-hidden="true"
        class="md-button__progress-indicator"
        :progress="normalizedLoadingProgress"
      />
    </span>
  </button>
</template>

<style scoped>
.md-button {
  --md-button-border-radius: 20px;
  --md-button-icon-size: 20dp;
  --md-button-height: 40px;
  --md-button-padding-left: 16px;
  --md-button-padding-right: 16px;
  --md-button-icon-gap: 8px;
  --md-button-border-width: 0px;
  --md-button-border-style: solid;
  --md-button-box-sizing: border-box;
  --md-button-target-size: var(--md-button-height);
  --md-private-button-container-color: transparent;
  --md-private-button-label-color: inherit;
  --md-private-button-icon-color: inherit;
  --md-private-button-outline-color: transparent;
  --md-private-button-elevation: var(--md-sys-elevation-level0);
  --md-private-button-state-layer-color: var(--md-private-button-label-color);
  --md-private-button-hover-state-layer-color: var(--md-private-button-state-layer-color);
  --md-private-button-focus-state-layer-color: var(--md-private-button-state-layer-color);
  --md-private-button-pressed-state-layer-color: var(--md-private-button-state-layer-color);
  --md-private-button-hover-label-color: var(--md-private-button-label-color);
  --md-private-button-focus-label-color: var(--md-private-button-label-color);
  --md-private-button-pressed-label-color: var(--md-private-button-label-color);
  --md-private-button-hover-icon-color: var(--md-private-button-icon-color);
  --md-private-button-focus-icon-color: var(--md-private-button-icon-color);
  --md-private-button-pressed-icon-color: var(--md-private-button-icon-color);
  --md-private-button-hover-outline-color: var(--md-private-button-outline-color);
  --md-private-button-focus-outline-color: var(--md-private-button-outline-color);
  --md-private-button-pressed-outline-color: var(--md-private-button-outline-color);
  --md-private-button-hover-elevation: var(--md-private-button-elevation);
  --md-private-button-focus-elevation: var(--md-private-button-elevation);
  --md-private-button-pressed-elevation: var(--md-private-button-elevation);
  --md-private-button-disabled-container-color: transparent;
  --md-private-button-disabled-label-color: var(--md-private-button-label-color);
  --md-private-button-disabled-label-opacity: 1;
  --md-private-button-disabled-icon-color: var(--md-private-button-icon-color);
  --md-private-button-disabled-icon-opacity: 1;
  --md-private-button-disabled-outline-color: var(--md-private-button-outline-color);
  --md-private-button-disabled-elevation: var(--md-private-button-elevation);
  --md-private-button-label-opacity: 1;
  --md-private-button-icon-opacity: 1;
  --md-private-button-rendered-container-color: var(--md-private-button-container-color);
  --md-private-button-rendered-label-color: var(--md-private-button-label-color);
  --md-private-button-rendered-icon-color: var(--md-private-button-icon-color);
  --md-private-button-rendered-outline-color: var(--md-private-button-outline-color);
  --md-private-button-rendered-elevation: var(--md-private-button-elevation);
  --md-private-button-rendered-state-layer-color: var(--md-private-button-state-layer-color);
  --md-private-state-layer-color: var(--md-private-button-rendered-state-layer-color);
  --md-private-state-layer-transition-duration: var(
    --md-private-motion-expressive-fast-effects-duration
  );
  --md-private-state-layer-transition-easing: var(
    --md-private-motion-expressive-fast-effects-easing
  );
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--md-button-height);
  padding-left: var(--md-button-padding-left);
  padding-right: var(--md-button-padding-right);
  border: var(--md-button-border-width) var(--md-button-border-style)
    var(--md-private-button-rendered-outline-color);
  box-sizing: var(--md-button-box-sizing);
  border-radius: var(--md-button-border-radius);
  background: var(--md-private-button-rendered-container-color);
  box-shadow: var(--md-private-button-rendered-elevation);
  color: var(--md-private-button-rendered-label-color);
  outline-color: var(--md-state-outline-color);
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  transition:
    border-radius var(--md-private-motion-expressive-fast-spatial-duration)
      var(--md-private-motion-expressive-fast-spatial-easing),
    box-shadow var(--md-private-motion-expressive-fast-spatial-duration)
      var(--md-private-motion-expressive-fast-spatial-easing),
    background-color var(--md-private-motion-expressive-fast-effects-duration)
      var(--md-private-motion-expressive-fast-effects-easing),
    border-color var(--md-private-motion-expressive-fast-effects-duration)
      var(--md-private-motion-expressive-fast-effects-easing);
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
    width: var(--md-button-target-size);
    height: var(--md-button-target-size);
    min-width: var(--md-button-target-size);
    min-height: var(--md-button-target-size);
    transform: translate(-50%, -50%);
    background: transparent;
  }

  &__content {
    position: relative;
    z-index: 2;
    display: flex;
    justify-content: center;
    align-items: center;
    gap: var(--md-button-icon-gap);
  }

  &__icon {
    display: inline-flex;
    justify-content: center;
    align-items: center;
    width: var(--md-button-icon-size, 1lh);
    height: var(--md-button-icon-size, 1lh);
    color: rgb(
      from var(--md-private-button-rendered-icon-color) r g b /
        var(--md-private-button-icon-opacity, 1)
    );
    --md-content-color: rgb(
      from var(--md-private-button-rendered-icon-color) r g b /
        var(--md-private-button-icon-opacity, 1)
    );
    transition:
      color var(--md-private-motion-expressive-fast-effects-duration)
        var(--md-private-motion-expressive-fast-effects-easing),
      opacity var(--md-private-motion-expressive-fast-effects-duration)
        var(--md-private-motion-expressive-fast-effects-easing);
    --md-symbol-size: var(--md-button-icon-size, 1lh);

    .md-button_loading & {
      opacity: 0;
    }
  }

  &__label-text {
    white-space: nowrap;
    color: rgb(
      from var(--md-private-button-rendered-label-color) r g b /
        var(--md-private-button-label-opacity, 1)
    );
    transition:
      color var(--md-private-motion-expressive-fast-effects-duration)
        var(--md-private-motion-expressive-fast-effects-easing),
      opacity var(--md-private-motion-expressive-fast-effects-duration)
        var(--md-private-motion-expressive-fast-effects-easing);
    background: none;

    .md-button_loading & {
      opacity: 0;
    }
  }

  &__progress-indicator {
    position: absolute;
    z-index: 2;
    width: 24px;
    height: 24px;
    --md-circular-progress-color: rgb(
      from var(--md-private-button-rendered-label-color) r g b /
        var(--md-private-button-label-opacity, 1)
    );
  }

  &.md-button_shape-round {
    --md-button-border-radius: var(--md-button-height);
  }

  &.md-button_color-elevated {
    --md-private-button-container-color: var(
      --md-comp-button-elevated-container-color,
      var(--md-sys-color-surface-container-low)
    );
    --md-private-button-label-color: var(
      --md-comp-button-elevated-label-text-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-icon-color: var(
      --md-comp-button-elevated-icon-color,
      var(--md-sys-color-primary)
    );
    --md-private-elevation-shadow-color: var(
      --md-comp-button-elevated-container-shadow-color,
      var(--md-sys-color-shadow)
    );
    --md-private-button-elevation: var(
      --md-comp-button-elevated-container-elevation,
      var(--md-sys-elevation-level1)
    );
    --md-private-button-hover-label-color: var(
      --md-comp-button-elevated-hovered-label-text-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-focus-label-color: var(
      --md-comp-button-elevated-focused-label-text-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-pressed-label-color: var(
      --md-comp-button-elevated-pressed-label-text-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-hover-icon-color: var(
      --md-comp-button-elevated-hovered-icon-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-focus-icon-color: var(
      --md-comp-button-elevated-focused-icon-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-pressed-icon-color: var(
      --md-comp-button-elevated-pressed-icon-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-hover-elevation: var(
      --md-comp-button-elevated-hovered-container-elevation,
      var(--md-sys-elevation-level2)
    );
    --md-private-button-focus-elevation: var(
      --md-comp-button-elevated-focused-container-elevation,
      var(--md-sys-elevation-level1)
    );
    --md-private-button-pressed-elevation: var(
      --md-comp-button-elevated-pressed-container-elevation,
      var(--md-sys-elevation-level1)
    );
    --md-private-button-hover-state-layer-color: var(
      --md-comp-button-elevated-hovered-state-layer-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-focus-state-layer-color: var(
      --md-comp-button-elevated-focused-state-layer-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-pressed-state-layer-color: var(
      --md-comp-button-elevated-pressed-state-layer-color,
      var(--md-sys-color-primary)
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-button-elevated-hovered-state-layer-opacity,
      var(--md-sys-state-hover-state-layer-opacity)
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-button-elevated-focused-state-layer-opacity,
      var(--md-sys-state-focus-state-layer-opacity)
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-button-elevated-pressed-state-layer-opacity,
      var(--md-sys-state-pressed-state-layer-opacity)
    );
    --md-private-button-disabled-container-color: rgb(
      from var(--md-comp-button-elevated-disabled-container-color, var(--md-sys-color-on-surface)) r
        g b / var(--md-comp-button-elevated-disabled-container-opacity, 0.1)
    );
    --md-private-button-disabled-label-color: var(
      --md-comp-button-elevated-disabled-label-text-color,
      var(--md-sys-color-on-surface)
    );
    --md-private-button-disabled-label-opacity: var(
      --md-comp-button-elevated-disabled-label-text-opacity,
      0.38
    );
    --md-private-button-disabled-icon-color: var(
      --md-comp-button-elevated-disabled-icon-color,
      var(--md-sys-color-on-surface)
    );
    --md-private-button-disabled-icon-opacity: var(
      --md-comp-button-elevated-disabled-icon-opacity,
      0.38
    );
    --md-private-button-disabled-elevation: var(
      --md-comp-button-elevated-disabled-container-elevation,
      var(--md-sys-elevation-level0)
    );

    &.md-button_variant-toggle {
      --md-private-button-container-color: var(
        --md-comp-button-elevated-unselected-container-color,
        var(--md-sys-color-surface-container-low)
      );
      --md-private-button-label-color: var(
        --md-comp-button-elevated-unselected-label-text-color,
        var(--md-sys-color-primary)
      );
      --md-private-button-icon-color: var(
        --md-comp-button-elevated-unselected-icon-color,
        var(--md-sys-color-primary)
      );
      --md-private-button-hover-label-color: var(
        --md-comp-button-elevated-unselected-hovered-label-text-color,
        var(--md-sys-color-primary)
      );
      --md-private-button-focus-label-color: var(
        --md-comp-button-elevated-unselected-focused-label-text-color,
        var(--md-sys-color-primary)
      );
      --md-private-button-pressed-label-color: var(
        --md-comp-button-elevated-unselected-pressed-label-text-color,
        var(--md-sys-color-primary)
      );
      --md-private-button-hover-icon-color: var(
        --md-comp-button-elevated-unselected-hovered-icon-color,
        var(--md-sys-color-primary)
      );
      --md-private-button-focus-icon-color: var(
        --md-comp-button-elevated-unselected-focused-icon-color,
        var(--md-sys-color-primary)
      );
      --md-private-button-pressed-icon-color: var(
        --md-comp-button-elevated-unselected-pressed-icon-color,
        var(--md-sys-color-primary)
      );
      --md-private-button-hover-state-layer-color: var(
        --md-comp-button-elevated-unselected-hovered-state-layer-color,
        var(--md-sys-color-primary)
      );
      --md-private-button-focus-state-layer-color: var(
        --md-comp-button-elevated-unselected-focused-state-layer-color,
        var(--md-sys-color-primary)
      );
      --md-private-button-pressed-state-layer-color: var(
        --md-comp-button-elevated-unselected-pressed-state-layer-color,
        var(--md-sys-color-primary)
      );

      &.md-button_selected:not(.md-state_disabled):not(:disabled) {
        --md-private-button-container-color: var(
          --md-comp-button-elevated-selected-container-color,
          var(--md-sys-color-primary)
        );
        --md-private-button-label-color: var(
          --md-comp-button-elevated-selected-label-text-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-icon-color: var(
          --md-comp-button-elevated-selected-icon-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-hover-label-color: var(
          --md-comp-button-elevated-selected-hovered-label-text-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-focus-label-color: var(
          --md-comp-button-elevated-selected-focused-label-text-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-pressed-label-color: var(
          --md-comp-button-elevated-selected-pressed-label-text-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-hover-icon-color: var(
          --md-comp-button-elevated-selected-hovered-icon-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-focus-icon-color: var(
          --md-comp-button-elevated-selected-focused-icon-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-pressed-icon-color: var(
          --md-comp-button-elevated-selected-pressed-icon-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-hover-state-layer-color: var(
          --md-comp-button-elevated-selected-hovered-state-layer-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-focus-state-layer-color: var(
          --md-comp-button-elevated-selected-focused-state-layer-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-pressed-state-layer-color: var(
          --md-comp-button-elevated-selected-pressed-state-layer-color,
          var(--md-sys-color-on-primary)
        );
      }
    }
  }

  &.md-button_color-filled {
    --md-private-button-container-color: var(
      --md-comp-button-filled-container-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-label-color: var(
      --md-comp-button-filled-label-text-color,
      var(--md-sys-color-on-primary)
    );
    --md-private-button-icon-color: var(
      --md-comp-button-filled-icon-color,
      var(--md-sys-color-on-primary)
    );
    --md-private-elevation-shadow-color: var(
      --md-comp-button-filled-container-shadow-color,
      var(--md-sys-color-shadow)
    );
    --md-private-button-elevation: var(
      --md-comp-button-filled-container-elevation,
      var(--md-sys-elevation-level0)
    );
    --md-private-button-hover-label-color: var(
      --md-comp-button-filled-hovered-label-text-color,
      var(--md-sys-color-on-primary)
    );
    --md-private-button-focus-label-color: var(
      --md-comp-button-filled-focused-label-text-color,
      var(--md-sys-color-on-primary)
    );
    --md-private-button-pressed-label-color: var(
      --md-comp-button-filled-pressed-label-text-color,
      var(--md-sys-color-on-primary)
    );
    --md-private-button-hover-icon-color: var(
      --md-comp-button-filled-hovered-icon-color,
      var(--md-sys-color-on-primary)
    );
    --md-private-button-focus-icon-color: var(
      --md-comp-button-filled-focused-icon-color,
      var(--md-sys-color-on-primary)
    );
    --md-private-button-pressed-icon-color: var(
      --md-comp-button-filled-pressed-icon-color,
      var(--md-sys-color-on-primary)
    );
    --md-private-button-hover-elevation: var(
      --md-comp-button-filled-hovered-container-elevation,
      var(--md-sys-elevation-level1)
    );
    --md-private-button-focus-elevation: var(
      --md-comp-button-filled-focused-container-elevation,
      var(--md-sys-elevation-level0)
    );
    --md-private-button-pressed-elevation: var(
      --md-comp-button-filled-pressed-container-elevation,
      var(--md-sys-elevation-level0)
    );
    --md-private-button-hover-state-layer-color: var(
      --md-comp-button-filled-hovered-state-layer-color,
      var(--md-sys-color-on-primary)
    );
    --md-private-button-focus-state-layer-color: var(
      --md-comp-button-filled-focused-state-layer-color,
      var(--md-sys-color-on-primary)
    );
    --md-private-button-pressed-state-layer-color: var(
      --md-comp-button-filled-pressed-state-layer-color,
      var(--md-sys-color-on-primary)
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-button-filled-hovered-state-layer-opacity,
      var(--md-sys-state-hover-state-layer-opacity)
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-button-filled-focused-state-layer-opacity,
      var(--md-sys-state-focus-state-layer-opacity)
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-button-filled-pressed-state-layer-opacity,
      var(--md-sys-state-pressed-state-layer-opacity)
    );
    --md-private-button-disabled-container-color: rgb(
      from var(--md-comp-button-filled-disabled-container-color, var(--md-sys-color-on-surface)) r g
        b / var(--md-comp-button-filled-disabled-container-opacity, 0.1)
    );
    --md-private-button-disabled-label-color: var(
      --md-comp-button-filled-disabled-label-text-color,
      var(--md-sys-color-on-surface)
    );
    --md-private-button-disabled-label-opacity: var(
      --md-comp-button-filled-disabled-label-text-opacity,
      0.38
    );
    --md-private-button-disabled-icon-color: var(
      --md-comp-button-filled-disabled-icon-color,
      var(--md-sys-color-on-surface)
    );
    --md-private-button-disabled-icon-opacity: var(
      --md-comp-button-filled-disabled-icon-opacity,
      0.38
    );
    --md-private-button-disabled-elevation: var(
      --md-comp-button-filled-disabled-container-elevation,
      var(--md-sys-elevation-level0)
    );

    &.md-button_variant-toggle {
      --md-private-button-container-color: var(
        --md-comp-button-filled-unselected-container-color,
        var(--md-sys-color-surface-container)
      );
      --md-private-button-label-color: var(
        --md-comp-button-filled-unselected-label-text-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-icon-color: var(
        --md-comp-button-filled-unselected-icon-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-hover-label-color: var(
        --md-comp-button-filled-unselected-hovered-label-text-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-focus-label-color: var(
        --md-comp-button-filled-unselected-focused-label-text-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-pressed-label-color: var(
        --md-comp-button-filled-unselected-pressed-label-text-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-hover-icon-color: var(
        --md-comp-button-filled-unselected-hovered-icon-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-focus-icon-color: var(
        --md-comp-button-filled-unselected-focused-icon-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-pressed-icon-color: var(
        --md-comp-button-filled-unselected-pressed-icon-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-hover-state-layer-color: var(
        --md-comp-button-filled-unselected-hovered-state-layer-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-focus-state-layer-color: var(
        --md-comp-button-filled-unselected-focused-state-layer-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-pressed-state-layer-color: var(
        --md-comp-button-filled-unselected-pressed-state-layer-color,
        var(--md-sys-color-on-surface-variant)
      );

      &.md-button_selected:not(.md-state_disabled):not(:disabled) {
        --md-private-button-container-color: var(
          --md-comp-button-filled-selected-container-color,
          var(--md-sys-color-primary)
        );
        --md-private-button-label-color: var(
          --md-comp-button-filled-selected-label-text-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-icon-color: var(
          --md-comp-button-filled-selected-icon-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-hover-label-color: var(
          --md-comp-button-filled-selected-hovered-label-text-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-focus-label-color: var(
          --md-comp-button-filled-selected-focused-label-text-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-pressed-label-color: var(
          --md-comp-button-filled-selected-pressed-label-text-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-hover-icon-color: var(
          --md-comp-button-filled-selected-hovered-icon-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-focus-icon-color: var(
          --md-comp-button-filled-selected-focused-icon-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-pressed-icon-color: var(
          --md-comp-button-filled-selected-pressed-icon-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-hover-state-layer-color: var(
          --md-comp-button-filled-selected-hovered-state-layer-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-focus-state-layer-color: var(
          --md-comp-button-filled-selected-focused-state-layer-color,
          var(--md-sys-color-on-primary)
        );
        --md-private-button-pressed-state-layer-color: var(
          --md-comp-button-filled-selected-pressed-state-layer-color,
          var(--md-sys-color-on-primary)
        );
      }
    }
  }

  &.md-button_color-tonal {
    --md-private-button-container-color: var(
      --md-comp-button-tonal-container-color,
      var(--md-sys-color-secondary-container)
    );
    --md-private-button-label-color: var(
      --md-comp-button-tonal-label-text-color,
      var(--md-sys-color-on-secondary-container)
    );
    --md-private-button-icon-color: var(
      --md-comp-button-tonal-icon-color,
      var(--md-sys-color-on-secondary-container)
    );
    --md-private-elevation-shadow-color: var(
      --md-comp-button-tonal-container-shadow-color,
      var(--md-sys-color-shadow)
    );
    --md-private-button-elevation: var(
      --md-comp-button-tonal-container-elevation,
      var(--md-sys-elevation-level0)
    );
    --md-private-button-hover-label-color: var(
      --md-comp-button-tonal-hovered-label-text-color,
      var(--md-sys-color-on-secondary-container)
    );
    --md-private-button-focus-label-color: var(
      --md-comp-button-tonal-focused-label-text-color,
      var(--md-sys-color-on-secondary-container)
    );
    --md-private-button-pressed-label-color: var(
      --md-comp-button-tonal-pressed-label-text-color,
      var(--md-sys-color-on-secondary-container)
    );
    --md-private-button-hover-icon-color: var(
      --md-comp-button-tonal-hovered-icon-color,
      var(--md-sys-color-on-secondary-container)
    );
    --md-private-button-focus-icon-color: var(
      --md-comp-button-tonal-focused-icon-color,
      var(--md-sys-color-on-secondary-container)
    );
    --md-private-button-pressed-icon-color: var(
      --md-comp-button-tonal-pressed-icon-color,
      var(--md-sys-color-on-secondary-container)
    );
    --md-private-button-hover-elevation: var(
      --md-comp-button-tonal-hovered-container-elevation,
      var(--md-sys-elevation-level1)
    );
    --md-private-button-focus-elevation: var(
      --md-comp-button-tonal-focused-container-elevation,
      var(--md-sys-elevation-level0)
    );
    --md-private-button-pressed-elevation: var(
      --md-comp-button-tonal-pressed-container-elevation,
      var(--md-sys-elevation-level0)
    );
    --md-private-button-hover-state-layer-color: var(
      --md-comp-button-tonal-hovered-state-layer-color,
      var(--md-sys-color-on-secondary-container)
    );
    --md-private-button-focus-state-layer-color: var(
      --md-comp-button-tonal-focused-state-layer-color,
      var(--md-sys-color-on-secondary-container)
    );
    --md-private-button-pressed-state-layer-color: var(
      --md-comp-button-tonal-pressed-state-layer-color,
      var(--md-sys-color-on-secondary-container)
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-button-tonal-hovered-state-layer-opacity,
      var(--md-sys-state-hover-state-layer-opacity)
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-button-tonal-focused-state-layer-opacity,
      var(--md-sys-state-focus-state-layer-opacity)
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-button-tonal-pressed-state-layer-opacity,
      var(--md-sys-state-pressed-state-layer-opacity)
    );
    --md-private-button-disabled-container-color: rgb(
      from var(--md-comp-button-tonal-disabled-container-color, var(--md-sys-color-on-surface)) r g
        b / var(--md-comp-button-tonal-disabled-container-opacity, 0.1)
    );
    --md-private-button-disabled-label-color: var(
      --md-comp-button-tonal-disabled-label-text-color,
      var(--md-sys-color-on-surface)
    );
    --md-private-button-disabled-label-opacity: var(
      --md-comp-button-tonal-disabled-label-text-opacity,
      0.38
    );
    --md-private-button-disabled-icon-color: var(
      --md-comp-button-tonal-disabled-icon-color,
      var(--md-sys-color-on-surface)
    );
    --md-private-button-disabled-icon-opacity: var(
      --md-comp-button-tonal-disabled-icon-opacity,
      0.38
    );
    --md-private-button-disabled-elevation: var(
      --md-comp-button-tonal-disabled-container-elevation,
      var(--md-sys-elevation-level0)
    );

    &.md-button_variant-toggle {
      --md-private-button-container-color: var(
        --md-comp-button-tonal-unselected-container-color,
        var(--md-sys-color-secondary-container)
      );
      --md-private-button-label-color: var(
        --md-comp-button-tonal-unselected-label-text-color,
        var(--md-sys-color-on-secondary-container)
      );
      --md-private-button-icon-color: var(
        --md-comp-button-tonal-unselected-icon-color,
        var(--md-sys-color-on-secondary-container)
      );
      --md-private-button-hover-label-color: var(
        --md-comp-button-tonal-unselected-hovered-label-text-color,
        var(--md-sys-color-on-secondary-container)
      );
      --md-private-button-focus-label-color: var(
        --md-comp-button-tonal-unselected-focused-label-text-color,
        var(--md-sys-color-on-secondary-container)
      );
      --md-private-button-pressed-label-color: var(
        --md-comp-button-tonal-unselected-pressed-label-text-color,
        var(--md-sys-color-on-secondary-container)
      );
      --md-private-button-hover-icon-color: var(
        --md-comp-button-tonal-unselected-hovered-icon-color,
        var(--md-sys-color-on-secondary-container)
      );
      --md-private-button-focus-icon-color: var(
        --md-comp-button-tonal-unselected-focused-icon-color,
        var(--md-sys-color-on-secondary-container)
      );
      --md-private-button-pressed-icon-color: var(
        --md-comp-button-tonal-unselected-pressed-icon-color,
        var(--md-sys-color-on-secondary-container)
      );
      --md-private-button-hover-state-layer-color: var(
        --md-comp-button-tonal-unselected-hovered-state-layer-color,
        var(--md-sys-color-on-secondary-container)
      );
      --md-private-button-focus-state-layer-color: var(
        --md-comp-button-tonal-unselected-focused-state-layer-color,
        var(--md-sys-color-on-secondary-container)
      );
      --md-private-button-pressed-state-layer-color: var(
        --md-comp-button-tonal-unselected-pressed-state-layer-color,
        var(--md-sys-color-on-secondary-container)
      );

      &.md-button_selected:not(.md-state_disabled):not(:disabled) {
        --md-private-button-container-color: var(
          --md-comp-button-tonal-selected-container-color,
          var(--md-sys-color-secondary)
        );
        --md-private-button-label-color: var(
          --md-comp-button-tonal-selected-label-text-color,
          var(--md-sys-color-on-secondary)
        );
        --md-private-button-icon-color: var(
          --md-comp-button-tonal-selected-icon-color,
          var(--md-sys-color-on-secondary)
        );
        --md-private-button-hover-label-color: var(
          --md-comp-button-tonal-selected-hovered-label-text-color,
          var(--md-sys-color-on-secondary)
        );
        --md-private-button-focus-label-color: var(
          --md-comp-button-tonal-selected-focused-label-text-color,
          var(--md-sys-color-on-secondary)
        );
        --md-private-button-pressed-label-color: var(
          --md-comp-button-tonal-selected-pressed-label-text-color,
          var(--md-sys-color-on-secondary)
        );
        --md-private-button-hover-icon-color: var(
          --md-comp-button-tonal-selected-hovered-icon-color,
          var(--md-sys-color-on-secondary)
        );
        --md-private-button-focus-icon-color: var(
          --md-comp-button-tonal-selected-focused-icon-color,
          var(--md-sys-color-on-secondary)
        );
        --md-private-button-pressed-icon-color: var(
          --md-comp-button-tonal-selected-pressed-icon-color,
          var(--md-sys-color-on-secondary)
        );
        --md-private-button-hover-state-layer-color: var(
          --md-comp-button-tonal-selected-hovered-state-layer-color,
          var(--md-sys-color-on-secondary)
        );
        --md-private-button-focus-state-layer-color: var(
          --md-comp-button-tonal-selected-focused-state-layer-color,
          var(--md-sys-color-on-secondary)
        );
        --md-private-button-pressed-state-layer-color: var(
          --md-comp-button-tonal-selected-pressed-state-layer-color,
          var(--md-sys-color-on-secondary)
        );
      }
    }
  }

  &.md-button_color-outlined {
    --md-button-border-style: solid;
    --md-button-box-sizing: border-box;
    /* md.comp.button.outlined publishes no container-elevation route (an outlined container has
       no shadow); this is a private-only constant, not a public component token. */
    --md-private-button-elevation: var(--md-sys-elevation-level0);
    --md-private-button-label-color: var(
      --md-comp-button-outlined-label-text-color,
      var(--md-sys-color-on-surface-variant)
    );
    --md-private-button-icon-color: var(
      --md-comp-button-outlined-icon-color,
      var(--md-sys-color-on-surface-variant)
    );
    --md-private-button-outline-color: var(
      --md-comp-button-outlined-outline-color,
      var(--md-sys-color-outline-variant)
    );
    --md-private-button-hover-label-color: var(
      --md-comp-button-outlined-hovered-label-text-color,
      var(--md-sys-color-on-surface-variant)
    );
    --md-private-button-focus-label-color: var(
      --md-comp-button-outlined-focused-label-text-color,
      var(--md-sys-color-on-surface-variant)
    );
    --md-private-button-pressed-label-color: var(
      --md-comp-button-outlined-pressed-label-text-color,
      var(--md-sys-color-on-surface-variant)
    );
    --md-private-button-hover-icon-color: var(
      --md-comp-button-outlined-hovered-icon-color,
      var(--md-sys-color-on-surface-variant)
    );
    --md-private-button-focus-icon-color: var(
      --md-comp-button-outlined-focused-icon-color,
      var(--md-sys-color-on-surface-variant)
    );
    --md-private-button-pressed-icon-color: var(
      --md-comp-button-outlined-pressed-icon-color,
      var(--md-sys-color-on-surface-variant)
    );
    --md-private-button-hover-outline-color: var(
      --md-comp-button-outlined-hovered-outline-color,
      var(--md-sys-color-outline-variant)
    );
    --md-private-button-focus-outline-color: var(
      --md-comp-button-outlined-focused-outline-color,
      var(--md-sys-color-outline-variant)
    );
    --md-private-button-pressed-outline-color: var(
      --md-comp-button-outlined-pressed-outline-color,
      var(--md-sys-color-outline-variant)
    );
    --md-private-button-hover-state-layer-color: var(
      --md-comp-button-outlined-hovered-state-layer-color,
      var(--md-sys-color-on-surface-variant)
    );
    --md-private-button-focus-state-layer-color: var(
      --md-comp-button-outlined-focused-state-layer-color,
      var(--md-sys-color-on-surface-variant)
    );
    --md-private-button-pressed-state-layer-color: var(
      --md-comp-button-outlined-pressed-state-layer-color,
      var(--md-sys-color-on-surface-variant)
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-button-outlined-hovered-state-layer-opacity,
      var(--md-sys-state-hover-state-layer-opacity)
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-button-outlined-focused-state-layer-opacity,
      var(--md-sys-state-focus-state-layer-opacity)
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-button-outlined-pressed-state-layer-opacity,
      var(--md-sys-state-pressed-state-layer-opacity)
    );
    --md-private-button-disabled-label-color: var(
      --md-comp-button-outlined-disabled-label-text-color,
      var(--md-sys-color-on-surface)
    );
    --md-private-button-disabled-label-opacity: var(
      --md-comp-button-outlined-disabled-label-text-opacity,
      0.38
    );
    --md-private-button-disabled-icon-color: var(
      --md-comp-button-outlined-disabled-icon-color,
      var(--md-sys-color-on-surface)
    );
    --md-private-button-disabled-icon-opacity: var(
      --md-comp-button-outlined-disabled-icon-opacity,
      0.38
    );
    --md-private-button-disabled-outline-color: var(
      --md-comp-button-outlined-disabled-outline-color,
      var(--md-sys-color-outline-variant)
    );

    &.md-button_variant-toggle {
      /* No unselected-qualified resting outline token is published; unselected resting outline
         uses the base md.comp.button.outlined.outline.color set above. */
      --md-private-button-label-color: var(
        --md-comp-button-outlined-unselected-label-text-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-icon-color: var(
        --md-comp-button-outlined-unselected-icon-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-hover-label-color: var(
        --md-comp-button-outlined-unselected-hovered-label-text-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-focus-label-color: var(
        --md-comp-button-outlined-unselected-focused-label-text-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-pressed-label-color: var(
        --md-comp-button-outlined-unselected-pressed-label-text-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-hover-icon-color: var(
        --md-comp-button-outlined-unselected-hovered-icon-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-focus-icon-color: var(
        --md-comp-button-outlined-unselected-focused-icon-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-pressed-icon-color: var(
        --md-comp-button-outlined-unselected-pressed-icon-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-hover-outline-color: var(
        --md-comp-button-outlined-unselected-hovered-outline-color,
        var(--md-sys-color-outline-variant)
      );
      --md-private-button-focus-outline-color: var(
        --md-comp-button-outlined-unselected-focused-outline-color,
        var(--md-sys-color-outline-variant)
      );
      --md-private-button-pressed-outline-color: var(
        --md-comp-button-outlined-unselected-pressed-outline-color,
        var(--md-sys-color-outline-variant)
      );
      --md-private-button-disabled-outline-color: var(
        --md-comp-button-outlined-unselected-disabled-outline-color,
        var(--md-sys-color-outline-variant)
      );
      --md-private-button-hover-state-layer-color: var(
        --md-comp-button-outlined-unselected-hovered-state-layer-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-focus-state-layer-color: var(
        --md-comp-button-outlined-unselected-focused-state-layer-color,
        var(--md-sys-color-on-surface-variant)
      );
      --md-private-button-pressed-state-layer-color: var(
        --md-comp-button-outlined-unselected-pressed-state-layer-color,
        var(--md-sys-color-on-surface-variant)
      );

      &.md-button_selected:not(.md-state_disabled):not(:disabled) {
        --md-private-button-container-color: var(
          --md-comp-button-outlined-selected-container-color,
          var(--md-sys-color-inverse-surface)
        );
        --md-private-button-label-color: var(
          --md-comp-button-outlined-selected-label-text-color,
          var(--md-sys-color-inverse-on-surface)
        );
        --md-private-button-icon-color: var(
          --md-comp-button-outlined-selected-icon-color,
          var(--md-sys-color-inverse-on-surface)
        );
        /* md.comp.button.outlined publishes no selected outline-color route; the selected
           outline visually follows the selected container color in every interaction state. */
        --md-private-button-outline-color: var(--md-private-button-container-color);
        --md-private-button-hover-outline-color: var(--md-private-button-container-color);
        --md-private-button-focus-outline-color: var(--md-private-button-container-color);
        --md-private-button-pressed-outline-color: var(--md-private-button-container-color);
        --md-private-button-hover-label-color: var(
          --md-comp-button-outlined-selected-hovered-label-text-color,
          var(--md-sys-color-inverse-on-surface)
        );
        --md-private-button-focus-label-color: var(
          --md-comp-button-outlined-selected-focused-label-text-color,
          var(--md-sys-color-inverse-on-surface)
        );
        --md-private-button-pressed-label-color: var(
          --md-comp-button-outlined-selected-pressed-label-text-color,
          var(--md-sys-color-inverse-on-surface)
        );
        --md-private-button-hover-icon-color: var(
          --md-comp-button-outlined-selected-hovered-icon-color,
          var(--md-sys-color-inverse-on-surface)
        );
        --md-private-button-focus-icon-color: var(
          --md-comp-button-outlined-selected-focused-icon-color,
          var(--md-sys-color-inverse-on-surface)
        );
        --md-private-button-pressed-icon-color: var(
          --md-comp-button-outlined-selected-pressed-icon-color,
          var(--md-sys-color-inverse-on-surface)
        );
        --md-private-button-hover-state-layer-color: var(
          --md-comp-button-outlined-selected-hovered-state-layer-color,
          var(--md-sys-color-inverse-on-surface)
        );
        --md-private-button-focus-state-layer-color: var(
          --md-comp-button-outlined-selected-focused-state-layer-color,
          var(--md-sys-color-inverse-on-surface)
        );
        --md-private-button-pressed-state-layer-color: var(
          --md-comp-button-outlined-selected-pressed-state-layer-color,
          var(--md-sys-color-inverse-on-surface)
        );
      }

      /* No published md.comp.button.outlined.selected.disabled.outline.color route; the disabled
         outline and label/icon colors fall through to the base outlined-disabled route below,
         which the spec publishes as the same value for both selected and unselected disabled. */
      &.md-button_selected.md-state_disabled,
      &.md-button_selected:disabled {
        --md-private-button-disabled-container-color: rgb(
          from
            var(
              --md-comp-button-outlined-selected-disabled-container-color,
              var(--md-sys-color-on-surface)
            )
            r g b / var(--md-comp-button-outlined-disabled-container-opacity, 0.1)
        );
      }
    }
  }

  &.md-button_color-text {
    /* md.comp.button.text publishes no container-elevation route (a text container has no
       shadow); this is a private-only constant, not a public component token. */
    --md-private-button-elevation: var(--md-sys-elevation-level0);
    --md-private-button-label-color: var(
      --md-comp-button-text-label-text-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-icon-color: var(
      --md-comp-button-text-icon-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-hover-label-color: var(
      --md-comp-button-text-hovered-label-text-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-focus-label-color: var(
      --md-comp-button-text-focused-label-text-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-pressed-label-color: var(
      --md-comp-button-text-pressed-label-text-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-hover-icon-color: var(
      --md-comp-button-text-hovered-icon-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-focus-icon-color: var(
      --md-comp-button-text-focused-icon-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-pressed-icon-color: var(
      --md-comp-button-text-pressed-icon-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-hover-state-layer-color: var(
      --md-comp-button-text-hovered-state-layer-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-focus-state-layer-color: var(
      --md-comp-button-text-focused-state-layer-color,
      var(--md-sys-color-primary)
    );
    --md-private-button-pressed-state-layer-color: var(
      --md-comp-button-text-pressed-state-layer-color,
      var(--md-sys-color-primary)
    );
    --md-private-state-hover-state-layer-opacity: var(
      --md-comp-button-text-hovered-state-layer-opacity,
      var(--md-sys-state-hover-state-layer-opacity)
    );
    --md-private-state-focus-state-layer-opacity: var(
      --md-comp-button-text-focused-state-layer-opacity,
      var(--md-sys-state-focus-state-layer-opacity)
    );
    --md-private-state-pressed-state-layer-opacity: var(
      --md-comp-button-text-pressed-state-layer-opacity,
      var(--md-sys-state-pressed-state-layer-opacity)
    );
    --md-private-button-disabled-label-color: var(
      --md-comp-button-text-disabled-label-text-color,
      var(--md-sys-color-on-surface)
    );
    --md-private-button-disabled-label-opacity: var(
      --md-comp-button-text-disabled-label-text-opacity,
      0.38
    );
    --md-private-button-disabled-icon-color: var(
      --md-comp-button-text-disabled-icon-color,
      var(--md-sys-color-on-surface)
    );
    --md-private-button-disabled-icon-opacity: var(
      --md-comp-button-text-disabled-icon-opacity,
      0.38
    );
    --md-private-button-disabled-container-color: rgb(
      from var(--md-comp-button-text-disabled-container-color, var(--md-sys-color-on-surface)) r g
        b / var(--md-comp-button-text-disabled-container-opacity, 0.1)
    );
  }

  &.md-state_hover:not(.md-state_disabled):not(:disabled),
  &:hover:not(:disabled) {
    --md-private-button-rendered-label-color: var(
      --md-private-button-hover-label-color,
      var(--md-private-button-label-color)
    );
    --md-private-button-rendered-icon-color: var(
      --md-private-button-hover-icon-color,
      var(--md-private-button-icon-color)
    );
    --md-private-button-rendered-outline-color: var(
      --md-private-button-hover-outline-color,
      var(--md-private-button-outline-color)
    );
    --md-private-button-rendered-elevation: var(
      --md-private-button-hover-elevation,
      var(--md-private-button-elevation)
    );
    --md-private-button-rendered-state-layer-color: var(
      --md-private-button-hover-state-layer-color,
      var(--md-private-button-state-layer-color)
    );
    --md-private-button-label-opacity: 1;
    --md-private-button-icon-opacity: 1;
    z-index: 1;
  }

  &.md-state_focused:not(.md-state_disabled):not(:disabled),
  &:focus-visible:not(:disabled) {
    --md-private-button-rendered-label-color: var(
      --md-private-button-focus-label-color,
      var(--md-private-button-label-color)
    );
    --md-private-button-rendered-icon-color: var(
      --md-private-button-focus-icon-color,
      var(--md-private-button-icon-color)
    );
    --md-private-button-rendered-outline-color: var(
      --md-private-button-focus-outline-color,
      var(--md-private-button-outline-color)
    );
    --md-private-button-rendered-elevation: var(
      --md-private-button-focus-elevation,
      var(--md-private-button-elevation)
    );
    --md-private-button-rendered-state-layer-color: var(
      --md-private-button-focus-state-layer-color,
      var(--md-private-button-state-layer-color)
    );
    --md-private-button-label-opacity: 1;
    --md-private-button-icon-opacity: 1;
    z-index: 1;
  }

  &.md-state_pressed:not(.md-state_disabled):not(:disabled),
  &:active:not(:disabled) {
    --md-private-button-rendered-label-color: var(
      --md-private-button-pressed-label-color,
      var(--md-private-button-label-color)
    );
    --md-private-button-rendered-icon-color: var(
      --md-private-button-pressed-icon-color,
      var(--md-private-button-icon-color)
    );
    --md-private-button-rendered-outline-color: var(
      --md-private-button-pressed-outline-color,
      var(--md-private-button-outline-color)
    );
    --md-private-button-rendered-elevation: var(
      --md-private-button-pressed-elevation,
      var(--md-private-button-elevation)
    );
    --md-private-button-rendered-state-layer-color: var(
      --md-private-button-pressed-state-layer-color,
      var(--md-private-button-state-layer-color)
    );
    --md-private-button-label-opacity: 1;
    --md-private-button-icon-opacity: 1;
  }

  &.md-state_disabled,
  &:disabled {
    --md-private-button-rendered-container-color: var(
      --md-private-button-disabled-container-color,
      var(--md-private-button-container-color)
    );
    --md-private-button-rendered-label-color: var(
      --md-private-button-disabled-label-color,
      var(--md-private-button-label-color)
    );
    --md-private-button-rendered-icon-color: var(
      --md-private-button-disabled-icon-color,
      var(--md-private-button-icon-color)
    );
    --md-private-button-rendered-outline-color: var(
      --md-private-button-disabled-outline-color,
      var(--md-private-button-outline-color)
    );
    --md-private-button-rendered-elevation: var(
      --md-private-button-disabled-elevation,
      var(--md-private-button-elevation)
    );
    --md-private-button-label-opacity: var(--md-private-button-disabled-label-opacity, 1);
    --md-private-button-icon-opacity: var(--md-private-button-disabled-icon-opacity, 1);
    --md-private-button-rendered-state-layer-color: transparent;
  }

  &.md-button_size {
    &-extra-small {
      --md-comp-button-xsmall-container-height: 32dp;
      --md-comp-button-xsmall-icon-size: 20dp;
      --md-comp-button-xsmall-leading-space: 12dp;
      --md-comp-button-xsmall-trailing-space: 12dp;
      --md-comp-button-xsmall-icon-label-space: 8dp;
      --md-comp-button-xsmall-outlined-outline-width: 1dp;
      --md-comp-button-xsmall-container-shape-round: var(--md-sys-shape-corner-full);
      --md-comp-button-xsmall-container-shape-square: var(--md-sys-shape-corner-medium);
      --md-comp-button-xsmall-pressed-container-shape: var(--md-sys-shape-corner-small);
      --md-comp-button-xsmall-selected-container-shape-round: var(--md-sys-shape-corner-medium);
      --md-comp-button-xsmall-selected-container-shape-square: var(--md-sys-shape-corner-full);
      --md-comp-button-xsmall-pressed-container-corner-size-motion-spring-stiffness: var(
        --md-sys-motion-spring-fast-spatial-stiffness
      );
      --md-comp-button-xsmall-pressed-container-corner-size-motion-spring-damping: var(
        --md-sys-motion-spring-fast-spatial-damping
      );

      --md-button-height: var(--md-comp-button-xsmall-container-height);
      --md-button-icon-size: var(--md-comp-button-xsmall-icon-size);
      --md-button-padding-left: var(--md-comp-button-xsmall-leading-space);
      --md-button-padding-right: var(--md-comp-button-xsmall-trailing-space);
      --md-button-icon-gap: var(--md-comp-button-xsmall-icon-label-space);
      --md-button-target-size: 48dp;

      &.md-button_color-outlined {
        --md-button-border-width: var(--md-comp-button-xsmall-outlined-outline-width);
      }

      &.md-button_shape-round {
        --md-button-border-radius: var(--md-comp-button-xsmall-container-shape-round);
      }
      &.md-button_shape-square {
        --md-button-border-radius: var(--md-comp-button-xsmall-container-shape-square);
      }

      &.md-button_shape-round.md-button_selected:not(.md-state_pressed):not(:active),
      &.md-button_shape-round.md-button_selected.md-state_disabled,
      &.md-button_shape-round.md-button_selected:disabled {
        --md-button-border-radius: var(--md-comp-button-xsmall-selected-container-shape-round);
      }

      &.md-button_shape-square.md-button_selected:not(.md-state_pressed):not(:active),
      &.md-button_shape-square.md-button_selected.md-state_disabled,
      &.md-button_shape-square.md-button_selected:disabled {
        --md-button-border-radius: var(--md-comp-button-xsmall-selected-container-shape-square);
      }

      &.md-state_pressed:not(.md-state_disabled):not(:disabled),
      &:active:not(:disabled) {
        --md-button-border-radius: var(--md-comp-button-xsmall-pressed-container-shape);
      }
    }

    &-small {
      --md-comp-button-small-container-height: 40dp;
      --md-comp-button-small-icon-size: 20dp;
      --md-comp-button-small-leading-space: 16dp;
      --md-comp-button-small-trailing-space: 16dp;
      --md-comp-button-small-icon-label-space: 8dp;
      --md-comp-button-small-outlined-outline-width: 1dp;
      --md-comp-button-small-container-shape-round: var(--md-sys-shape-corner-full);
      --md-comp-button-small-container-shape-square: var(--md-sys-shape-corner-medium);
      --md-comp-button-small-pressed-container-shape: var(--md-sys-shape-corner-small);
      --md-comp-button-small-selected-container-shape-round: var(--md-sys-shape-corner-medium);
      --md-comp-button-small-selected-container-shape-square: var(--md-sys-shape-corner-full);
      --md-comp-button-small-pressed-container-corner-size-motion-spring-stiffness: var(
        --md-sys-motion-spring-fast-spatial-stiffness
      );
      --md-comp-button-small-pressed-container-corner-size-motion-spring-damping: var(
        --md-sys-motion-spring-fast-spatial-damping
      );

      --md-button-height: var(--md-comp-button-small-container-height);
      --md-button-icon-size: var(--md-comp-button-small-icon-size);
      --md-button-padding-left: var(--md-comp-button-small-leading-space);
      --md-button-padding-right: var(--md-comp-button-small-trailing-space);
      --md-button-icon-gap: var(--md-comp-button-small-icon-label-space);
      --md-button-target-size: 48dp;

      &.md-button_color-outlined {
        --md-button-border-width: var(--md-comp-button-small-outlined-outline-width);
      }

      &.md-button_shape-round {
        --md-button-border-radius: var(--md-comp-button-small-container-shape-round);
      }
      &.md-button_shape-square {
        --md-button-border-radius: var(--md-comp-button-small-container-shape-square);
      }

      &.md-button_shape-round.md-button_selected:not(.md-state_pressed):not(:active),
      &.md-button_shape-round.md-button_selected.md-state_disabled,
      &.md-button_shape-round.md-button_selected:disabled {
        --md-button-border-radius: var(--md-comp-button-small-selected-container-shape-round);
      }

      &.md-button_shape-square.md-button_selected:not(.md-state_pressed):not(:active),
      &.md-button_shape-square.md-button_selected.md-state_disabled,
      &.md-button_shape-square.md-button_selected:disabled {
        --md-button-border-radius: var(--md-comp-button-small-selected-container-shape-square);
      }

      &.md-state_pressed:not(.md-state_disabled):not(:disabled),
      &:active:not(:disabled) {
        --md-button-border-radius: var(--md-comp-button-small-pressed-container-shape);
      }
    }

    &-medium {
      --md-comp-button-medium-container-height: 56dp;
      --md-comp-button-medium-icon-size: 24dp;
      --md-comp-button-medium-leading-space: 24dp;
      --md-comp-button-medium-trailing-space: 24dp;
      --md-comp-button-medium-icon-label-space: 8dp;
      --md-comp-button-medium-outlined-outline-width: 1dp;
      --md-comp-button-medium-container-shape-round: var(--md-sys-shape-corner-full);
      --md-comp-button-medium-container-shape-square: var(--md-sys-shape-corner-large);
      --md-comp-button-medium-pressed-container-shape: var(--md-sys-shape-corner-medium);
      --md-comp-button-medium-selected-container-shape-round: var(--md-sys-shape-corner-large);
      --md-comp-button-medium-selected-container-shape-square: var(--md-sys-shape-corner-full);
      --md-comp-button-medium-pressed-container-corner-size-motion-spring-stiffness: var(
        --md-sys-motion-spring-fast-spatial-stiffness
      );
      --md-comp-button-medium-pressed-container-corner-size-motion-spring-damping: var(
        --md-sys-motion-spring-fast-spatial-damping
      );

      --md-button-height: var(--md-comp-button-medium-container-height);
      --md-button-icon-size: var(--md-comp-button-medium-icon-size);
      --md-button-padding-left: var(--md-comp-button-medium-leading-space);
      --md-button-padding-right: var(--md-comp-button-medium-trailing-space);
      --md-button-icon-gap: var(--md-comp-button-medium-icon-label-space);

      &.md-button_color-outlined {
        --md-button-border-width: var(--md-comp-button-medium-outlined-outline-width);
      }

      &.md-button_shape-round {
        --md-button-border-radius: var(--md-comp-button-medium-container-shape-round);
      }
      &.md-button_shape-square {
        --md-button-border-radius: var(--md-comp-button-medium-container-shape-square);
      }

      &.md-button_shape-round.md-button_selected:not(.md-state_pressed):not(:active),
      &.md-button_shape-round.md-button_selected.md-state_disabled,
      &.md-button_shape-round.md-button_selected:disabled {
        --md-button-border-radius: var(--md-comp-button-medium-selected-container-shape-round);
      }

      &.md-button_shape-square.md-button_selected:not(.md-state_pressed):not(:active),
      &.md-button_shape-square.md-button_selected.md-state_disabled,
      &.md-button_shape-square.md-button_selected:disabled {
        --md-button-border-radius: var(--md-comp-button-medium-selected-container-shape-square);
      }

      &.md-state_pressed:not(.md-state_disabled):not(:disabled),
      &:active:not(:disabled) {
        --md-button-border-radius: var(--md-comp-button-medium-pressed-container-shape);
      }
    }

    &-large {
      --md-comp-button-large-container-height: 96dp;
      --md-comp-button-large-icon-size: 32dp;
      --md-comp-button-large-leading-space: 48dp;
      --md-comp-button-large-trailing-space: 48dp;
      --md-comp-button-large-icon-label-space: 12dp;
      --md-comp-button-large-outlined-outline-width: 2dp;
      --md-comp-button-large-container-shape-round: var(--md-sys-shape-corner-full);
      --md-comp-button-large-container-shape-square: var(--md-sys-shape-corner-extra-large);
      --md-comp-button-large-pressed-container-shape: var(--md-sys-shape-corner-large);
      --md-comp-button-large-selected-container-shape-round: var(--md-sys-shape-corner-extra-large);
      --md-comp-button-large-selected-container-shape-square: var(--md-sys-shape-corner-full);
      --md-comp-button-large-pressed-container-corner-size-motion-spring-stiffness: var(
        --md-sys-motion-spring-fast-spatial-stiffness
      );
      --md-comp-button-large-pressed-container-corner-size-motion-spring-damping: var(
        --md-sys-motion-spring-fast-spatial-damping
      );

      --md-button-height: var(--md-comp-button-large-container-height);
      --md-button-icon-size: var(--md-comp-button-large-icon-size);
      --md-button-padding-left: var(--md-comp-button-large-leading-space);
      --md-button-padding-right: var(--md-comp-button-large-trailing-space);
      --md-button-icon-gap: var(--md-comp-button-large-icon-label-space);

      &.md-button_color-outlined {
        --md-button-border-width: var(--md-comp-button-large-outlined-outline-width);
      }

      &.md-button_shape-round {
        --md-button-border-radius: var(--md-comp-button-large-container-shape-round);
      }
      &.md-button_shape-square {
        --md-button-border-radius: var(--md-comp-button-large-container-shape-square);
      }

      &.md-button_shape-round.md-button_selected:not(.md-state_pressed):not(:active),
      &.md-button_shape-round.md-button_selected.md-state_disabled,
      &.md-button_shape-round.md-button_selected:disabled {
        --md-button-border-radius: var(--md-comp-button-large-selected-container-shape-round);
      }

      &.md-button_shape-square.md-button_selected:not(.md-state_pressed):not(:active),
      &.md-button_shape-square.md-button_selected.md-state_disabled,
      &.md-button_shape-square.md-button_selected:disabled {
        --md-button-border-radius: var(--md-comp-button-large-selected-container-shape-square);
      }

      &.md-state_pressed:not(.md-state_disabled):not(:disabled),
      &:active:not(:disabled) {
        --md-button-border-radius: var(--md-comp-button-large-pressed-container-shape);
      }
    }

    &-extra-large {
      --md-comp-button-xlarge-container-height: 136dp;
      --md-comp-button-xlarge-icon-size: 40dp;
      --md-comp-button-xlarge-leading-space: 64dp;
      --md-comp-button-xlarge-trailing-space: 64dp;
      --md-comp-button-xlarge-icon-label-space: 16dp;
      --md-comp-button-xlarge-outlined-outline-width: 3dp;
      --md-comp-button-xlarge-container-shape-round: var(--md-sys-shape-corner-full);
      --md-comp-button-xlarge-container-shape-square: var(--md-sys-shape-corner-extra-large);
      --md-comp-button-xlarge-pressed-container-shape: var(--md-sys-shape-corner-large);
      --md-comp-button-xlarge-selected-container-shape-round: var(
        --md-sys-shape-corner-extra-large
      );
      --md-comp-button-xlarge-selected-container-shape-square: var(--md-sys-shape-corner-full);
      --md-comp-button-xlarge-pressed-container-corner-size-motion-spring-stiffness: var(
        --md-sys-motion-spring-fast-spatial-stiffness
      );
      --md-comp-button-xlarge-pressed-container-corner-size-motion-spring-damping: var(
        --md-sys-motion-spring-fast-spatial-damping
      );

      --md-button-height: var(--md-comp-button-xlarge-container-height);
      --md-button-icon-size: var(--md-comp-button-xlarge-icon-size);
      --md-button-padding-left: var(--md-comp-button-xlarge-leading-space);
      --md-button-padding-right: var(--md-comp-button-xlarge-trailing-space);
      --md-button-icon-gap: var(--md-comp-button-xlarge-icon-label-space);

      &.md-button_color-outlined {
        --md-button-border-width: var(--md-comp-button-xlarge-outlined-outline-width);
      }

      &.md-button_shape-round {
        --md-button-border-radius: var(--md-comp-button-xlarge-container-shape-round);
      }
      &.md-button_shape-square {
        --md-button-border-radius: var(--md-comp-button-xlarge-container-shape-square);
      }

      &.md-button_shape-round.md-button_selected:not(.md-state_pressed):not(:active),
      &.md-button_shape-round.md-button_selected.md-state_disabled,
      &.md-button_shape-round.md-button_selected:disabled {
        --md-button-border-radius: var(--md-comp-button-xlarge-selected-container-shape-round);
      }

      &.md-button_shape-square.md-button_selected:not(.md-state_pressed):not(:active),
      &.md-button_shape-square.md-button_selected.md-state_disabled,
      &.md-button_shape-square.md-button_selected:disabled {
        --md-button-border-radius: var(--md-comp-button-xlarge-selected-container-shape-square);
      }

      &.md-state_pressed:not(.md-state_disabled):not(:disabled),
      &:active:not(:disabled) {
        --md-button-border-radius: var(--md-comp-button-xlarge-pressed-container-shape);
      }
    }
  }
}
</style>
