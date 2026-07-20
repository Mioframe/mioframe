<script setup lang="ts">
import { isNumber } from 'es-toolkit/compat';
import { computed, onMounted, useTemplateRef, warn, watchEffect } from 'vue';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { MDStateLayer, useRipple, useStateLayer } from '@shared/ui/State';
import {
  isUnsupportedTextToggle as resolveIsUnsupportedTextToggle,
  resolveAppliedSelected,
  resolveAppliedVariant,
  resolveLabelTypescaleClass,
} from './resolveButtonPresentation';

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
  icon(): unknown;
}>();

const onButtonClick = (event: MouseEvent) => {
  emit('click', event);
};

const buttonEl = useTemplateRef<HTMLButtonElement>('buttonEl');
const { hover, focused, durationPressedState } = useStateLayer(buttonEl);
const showVisualState = computed(() => !props.disabled);
const isUnsupportedTextToggle = computed(() =>
  resolveIsUnsupportedTextToggle(props.color, props.variant),
);
const appliedVariant = computed(() => resolveAppliedVariant(props.color, props.variant));
const isToggle = computed(() => appliedVariant.value === 'toggle');
const appliedSelected = computed(() =>
  resolveAppliedSelected(props.color, props.variant, props.selected),
);
const labelTypescaleClass = computed(() => resolveLabelTypescaleClass(props.size));

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
    });
  });
}
</script>

<template>
  <button
    ref="buttonEl"
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
        'md-button_loading': props.loading !== undefined && props.loading !== false,
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
        v-if="props.loading !== undefined && props.loading !== false"
        class="md-button__progress-indicator"
        :progress="isNumber(props.loading) ? props.loading : undefined"
      />
    </span>
  </button>
</template>

<style scoped src="./MDButton.css"></style>
