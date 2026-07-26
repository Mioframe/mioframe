<script setup lang="ts">
import '@m3e/web/button';
import { isNumber } from 'es-toolkit/compat';
import { computed, defineComponent, h, onMounted, warn, watchEffect } from 'vue';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';

const props = withDefaults(
  defineProps<{
    /** Native button type. Defaults to `button` to avoid accidental form submission. */
    nativeType?: 'button' | 'submit' | 'reset' | undefined;
    /** Material Button appearance. */
    color?: 'elevated' | 'filled' | 'tonal' | 'outlined' | 'text' | undefined;
    /** Visible label and accessible name. */
    label: string;
    /** Blocks focus and activation through the renderer's documented disabled contract. */
    disabled?: boolean | undefined;
    /** Shows an indeterminate or determinate progress indicator while preserving activation. */
    loading?: number | boolean | undefined;
    /** Stateless action or consumer-controlled toggle intent. */
    variant?: 'default' | 'toggle' | undefined;
    /** Material Button size. */
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | undefined;
    /** Round or square container shape. */
    shape?: 'round' | 'square' | undefined;
    /** Consumer-controlled toggle selection. Ignored for default and text buttons. */
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
  /** Stable action event normalized from the renderer host click. */
  click: [event: MouseEvent];
  /** Controlled toggle intent; the parent remains the selected-state owner. */
  'update:selected': [selected: boolean];
}>();

const slots = defineSlots<{
  /** Leading icon content. */
  icon(): unknown;
}>();

const MDButtonIconSlot = defineComponent({
  name: 'MDButtonIconSlot',
  setup(_, { slots: iconSlots }) {
    return () => h('span', { class: 'md-button__icon', slot: 'icon' }, iconSlots.default?.());
  },
});

const isLoading = computed(() => props.loading !== undefined && props.loading !== false);
const isUnsupportedTextToggle = computed(
  () => props.color === 'text' && props.variant === 'toggle',
);
const isToggle = computed(() => props.variant === 'toggle' && !isUnsupportedTextToggle.value);
const appliedSelected = computed(() => isToggle.value && !!props.selected);
const rendererShape = computed(() => (props.shape === 'round' ? 'rounded' : 'square'));

const onBeforeInput = (event: InputEvent) => {
  if (!isToggle.value) return;

  event.preventDefault();
  emit('update:selected', !appliedSelected.value);
};

const onClick = (event: MouseEvent) => {
  emit('click', event);
};

if (import.meta.env.DEV) {
  onMounted(() => {
    watchEffect(() => {
      if (isUnsupportedTextToggle.value) {
        warn(
          'MDButton: `color="text"` does not support `variant="toggle"` — rendering as a default action.',
        );
      } else if (props.selected && !isToggle.value) {
        warn('MDButton: `selected` has no effect unless `variant` is "toggle".');
      }
    });
  });
}
</script>

<template>
  <m3e-button
    class="md-button"
    :aria-busy="isLoading ? 'true' : undefined"
    :disabled="props.disabled"
    :selected="appliedSelected"
    :shape="rendererShape"
    :size="props.size"
    :toggle="isToggle"
    :type="props.nativeType"
    :variant="props.color"
    @beforeinput="onBeforeInput"
    @click.stop="onClick"
  >
    <MDButtonIconSlot v-if="!!slots.icon">
      <slot name="icon" />
    </MDButtonIconSlot>
    <span class="md-button__label-text">{{ props.label }}</span>
    <MDCircularProgressIndicator
      v-if="isLoading"
      class="md-button__progress-indicator"
      :progress="isNumber(props.loading) ? props.loading : undefined"
    />
  </m3e-button>
</template>

<style scoped>
.md-button {
  /* Public Mioframe Button tokens map only to documented m3e Button inputs. */
  --m3e-elevated-button-focus-container-elevation: var(
    --md-comp-button-elevated-focused-container-elevation
  );
  --m3e-elevated-button-focus-icon-color: var(--md-comp-button-elevated-focused-icon-color);
  --m3e-elevated-button-focus-label-text-color: var(
    --md-comp-button-elevated-focused-label-text-color
  );
  --m3e-elevated-button-focus-state-layer-color: var(
    --md-comp-button-elevated-focused-state-layer-color
  );
  --m3e-elevated-button-focus-state-layer-opacity: var(
    --md-comp-button-elevated-focused-state-layer-opacity
  );
  --m3e-elevated-button-hover-container-elevation: var(
    --md-comp-button-elevated-hovered-container-elevation
  );
  --m3e-elevated-button-hover-icon-color: var(--md-comp-button-elevated-hovered-icon-color);
  --m3e-elevated-button-hover-label-text-color: var(
    --md-comp-button-elevated-hovered-label-text-color
  );
  --m3e-elevated-button-hover-state-layer-color: var(
    --md-comp-button-elevated-hovered-state-layer-color
  );
  --m3e-elevated-button-hover-state-layer-opacity: var(
    --md-comp-button-elevated-hovered-state-layer-opacity
  );
  --m3e-elevated-button-icon-color: var(--md-comp-button-elevated-icon-color);
  --m3e-elevated-button-label-text-color: var(--md-comp-button-elevated-label-text-color);
  --m3e-elevated-button-pressed-container-elevation: var(
    --md-comp-button-elevated-pressed-container-elevation
  );
  --m3e-elevated-button-pressed-icon-color: var(--md-comp-button-elevated-pressed-icon-color);
  --m3e-elevated-button-pressed-label-text-color: var(
    --md-comp-button-elevated-pressed-label-text-color
  );
  --m3e-elevated-button-pressed-state-layer-color: var(
    --md-comp-button-elevated-pressed-state-layer-color
  );
  --m3e-elevated-button-pressed-state-layer-opacity: var(
    --md-comp-button-elevated-pressed-state-layer-opacity
  );
  --m3e-filled-button-container-color: var(--md-comp-button-filled-container-color);
  --m3e-filled-button-focus-container-elevation: var(
    --md-comp-button-filled-focused-container-elevation
  );
  --m3e-filled-button-focus-icon-color: var(--md-comp-button-filled-focused-icon-color);
  --m3e-filled-button-focus-label-text-color: var(--md-comp-button-filled-focused-label-text-color);
  --m3e-filled-button-focus-state-layer-color: var(
    --md-comp-button-filled-focused-state-layer-color
  );
  --m3e-filled-button-focus-state-layer-opacity: var(
    --md-comp-button-filled-focused-state-layer-opacity
  );
  --m3e-filled-button-hover-container-elevation: var(
    --md-comp-button-filled-hovered-container-elevation
  );
  --m3e-filled-button-hover-icon-color: var(--md-comp-button-filled-hovered-icon-color);
  --m3e-filled-button-hover-label-text-color: var(--md-comp-button-filled-hovered-label-text-color);
  --m3e-filled-button-hover-state-layer-color: var(
    --md-comp-button-filled-hovered-state-layer-color
  );
  --m3e-filled-button-hover-state-layer-opacity: var(
    --md-comp-button-filled-hovered-state-layer-opacity
  );
  --m3e-filled-button-icon-color: var(--md-comp-button-filled-icon-color);
  --m3e-filled-button-label-text-color: var(--md-comp-button-filled-label-text-color);
  --m3e-filled-button-pressed-container-elevation: var(
    --md-comp-button-filled-pressed-container-elevation
  );
  --m3e-filled-button-pressed-icon-color: var(--md-comp-button-filled-pressed-icon-color);
  --m3e-filled-button-pressed-label-text-color: var(
    --md-comp-button-filled-pressed-label-text-color
  );
  --m3e-filled-button-pressed-state-layer-color: var(
    --md-comp-button-filled-pressed-state-layer-color
  );
  --m3e-filled-button-pressed-state-layer-opacity: var(
    --md-comp-button-filled-pressed-state-layer-opacity
  );
  --m3e-outlined-button-focus-icon-color: var(--md-comp-button-outlined-focused-icon-color);
  --m3e-outlined-button-focus-label-text-color: var(
    --md-comp-button-outlined-focused-label-text-color
  );
  --m3e-outlined-button-focus-outline-color: var(--md-comp-button-outlined-focused-outline-color);
  --m3e-outlined-button-focus-state-layer-color: var(
    --md-comp-button-outlined-focused-state-layer-color
  );
  --m3e-outlined-button-focus-state-layer-opacity: var(
    --md-comp-button-outlined-focused-state-layer-opacity
  );
  --m3e-outlined-button-hover-icon-color: var(--md-comp-button-outlined-hovered-icon-color);
  --m3e-outlined-button-hover-label-text-color: var(
    --md-comp-button-outlined-hovered-label-text-color
  );
  --m3e-outlined-button-hover-outline-color: var(--md-comp-button-outlined-hovered-outline-color);
  --m3e-outlined-button-hover-state-layer-color: var(
    --md-comp-button-outlined-hovered-state-layer-color
  );
  --m3e-outlined-button-hover-state-layer-opacity: var(
    --md-comp-button-outlined-hovered-state-layer-opacity
  );
  --m3e-outlined-button-pressed-icon-color: var(--md-comp-button-outlined-pressed-icon-color);
  --m3e-outlined-button-pressed-label-text-color: var(
    --md-comp-button-outlined-pressed-label-text-color
  );
  --m3e-outlined-button-pressed-outline-color: var(--md-comp-button-outlined-pressed-outline-color);
  --m3e-outlined-button-pressed-state-layer-color: var(
    --md-comp-button-outlined-pressed-state-layer-color
  );
  --m3e-outlined-button-pressed-state-layer-opacity: var(
    --md-comp-button-outlined-pressed-state-layer-opacity
  );
  --m3e-text-button-focus-icon-color: var(--md-comp-button-text-focused-icon-color);
  --m3e-text-button-focus-label-text-color: var(--md-comp-button-text-focused-label-text-color);
  --m3e-text-button-focus-state-layer-color: var(--md-comp-button-text-focused-state-layer-color);
  --m3e-text-button-focus-state-layer-opacity: var(
    --md-comp-button-text-focused-state-layer-opacity
  );
  --m3e-text-button-hover-icon-color: var(--md-comp-button-text-hovered-icon-color);
  --m3e-text-button-hover-label-text-color: var(--md-comp-button-text-hovered-label-text-color);
  --m3e-text-button-hover-state-layer-color: var(--md-comp-button-text-hovered-state-layer-color);
  --m3e-text-button-hover-state-layer-opacity: var(
    --md-comp-button-text-hovered-state-layer-opacity
  );
  --m3e-text-button-icon-color: var(--md-comp-button-text-icon-color);
  --m3e-text-button-label-text-color: var(--md-comp-button-text-label-text-color);
  --m3e-text-button-pressed-icon-color: var(--md-comp-button-text-pressed-icon-color);
  --m3e-text-button-pressed-label-text-color: var(--md-comp-button-text-pressed-label-text-color);
  --m3e-text-button-pressed-state-layer-color: var(--md-comp-button-text-pressed-state-layer-color);
  --m3e-text-button-pressed-state-layer-opacity: var(
    --md-comp-button-text-pressed-state-layer-opacity
  );
  --m3e-tonal-button-focus-container-elevation: var(
    --md-comp-button-tonal-focused-container-elevation
  );
  --m3e-tonal-button-focus-icon-color: var(--md-comp-button-tonal-focused-icon-color);
  --m3e-tonal-button-focus-label-text-color: var(--md-comp-button-tonal-focused-label-text-color);
  --m3e-tonal-button-focus-state-layer-color: var(--md-comp-button-tonal-focused-state-layer-color);
  --m3e-tonal-button-focus-state-layer-opacity: var(
    --md-comp-button-tonal-focused-state-layer-opacity
  );
  --m3e-tonal-button-hover-container-elevation: var(
    --md-comp-button-tonal-hovered-container-elevation
  );
  --m3e-tonal-button-hover-icon-color: var(--md-comp-button-tonal-hovered-icon-color);
  --m3e-tonal-button-hover-label-text-color: var(--md-comp-button-tonal-hovered-label-text-color);
  --m3e-tonal-button-hover-state-layer-color: var(--md-comp-button-tonal-hovered-state-layer-color);
  --m3e-tonal-button-hover-state-layer-opacity: var(
    --md-comp-button-tonal-hovered-state-layer-opacity
  );
  --m3e-tonal-button-icon-color: var(--md-comp-button-tonal-icon-color);
  --m3e-tonal-button-label-text-color: var(--md-comp-button-tonal-label-text-color);
  --m3e-tonal-button-pressed-container-elevation: var(
    --md-comp-button-tonal-pressed-container-elevation
  );
  --m3e-tonal-button-pressed-icon-color: var(--md-comp-button-tonal-pressed-icon-color);
  --m3e-tonal-button-pressed-label-text-color: var(--md-comp-button-tonal-pressed-label-text-color);
  --m3e-tonal-button-pressed-state-layer-color: var(
    --md-comp-button-tonal-pressed-state-layer-color
  );
  --m3e-tonal-button-pressed-state-layer-opacity: var(
    --md-comp-button-tonal-pressed-state-layer-opacity
  );
  vertical-align: middle;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.md-button[disabled] {
  cursor: default;
}

.md-button__icon {
  display: inline-flex;
  color: inherit;
}

.md-button__progress-indicator {
  display: inline-flex;
  margin-inline-start: 8px;
  color: inherit;
  --md-circular-progress-indicator-size: 18px;
}
</style>
