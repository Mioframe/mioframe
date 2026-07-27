<script setup lang="ts">
import '@m3e/web/button';
import type {
  ButtonShape as RendererButtonShape,
  ButtonSize as RendererButtonSize,
  ButtonVariant as RendererButtonVariant,
  M3eButtonElement,
} from '@m3e/web/button';
import { computed, defineComponent, h, onMounted, warn, watchEffect } from 'vue';
import { MDLoadingIndicator } from '../loading-indicator';

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
    /** Stateless action or consumer-controlled toggle intent. */
    variant?: 'default' | 'toggle' | undefined;
    /** Material Button size. */
    size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | undefined;
    /** Round or square container shape. */
    shape?: 'round' | 'square' | undefined;
    /** Consumer-controlled toggle selection. Ignored for default actions. */
    selected?: boolean | undefined;
    /**
     * Shows a Material Loading indicator in place of the leading icon for a short
     * async action (Loading indicator placement guidance). Takes precedence over
     * both the normal and selected-state icon routes; the appropriate icon is
     * restored once loading ends.
     */
    loading?: boolean | undefined;
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
  /** Label content rendered while a toggle Button is selected. */
  'selected-label'(): unknown;
  /** Leading icon rendered while a toggle Button is selected. */
  'selected-icon'(): unknown;
}>();

const MDButtonSlottedContent = defineComponent({
  name: 'MDButtonSlottedContent',
  props: {
    slotName: {
      type: String,
      required: true,
    },
  },
  setup(slotProps, { slots: contentSlots }) {
    return () => h('span', { slot: slotProps.slotName }, contentSlots.default?.());
  },
});

const isToggle = computed(() => props.variant === 'toggle');
const appliedSelected = computed(() => isToggle.value && !!props.selected);
const isLoading = computed(() => !!props.loading);
const rendererVariant = computed<RendererButtonVariant>(() => props.color);
const rendererSize = computed<RendererButtonSize>(() => props.size);
const rendererShape = computed<RendererButtonShape>(() =>
  props.shape === 'round' ? 'rounded' : 'square',
);
const rendererType = computed<M3eButtonElement['type']>(() => props.nativeType);
/**
 * Mioframe Button-to-Loading-indicator composition mapping (not the official Loading
 * indicator size API, and not the Button icon-size tokens): extra-small/small/medium
 * map to 24, large to 32, extra-large to 40.
 */
const loadingIndicatorSize = computed<number>(
  () =>
    ({
      'extra-small': 24,
      small: 24,
      medium: 24,
      large: 32,
      'extra-large': 40,
    })[props.size],
);

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
      if (props.selected && !isToggle.value) {
        warn('MDButton: `selected` has no effect unless `variant` is "toggle".');
      }
    });
  });
}
</script>

<template>
  <!-- eslint-disable vue/attribute-hyphenation -- The m3e Boolean must be bound as a camel-case property; its dashed attribute would treat false as present. -->
  <m3e-button
    class="md-button"
    :aria-busy="isLoading ? 'true' : undefined"
    :disabled="props.disabled"
    :selected="appliedSelected"
    :shape="rendererShape"
    :size="rendererSize"
    :toggle="isToggle"
    :type="rendererType"
    :variant="rendererVariant"
    @beforeinput="onBeforeInput"
    @click="onClick"
  >
    <MDButtonSlottedContent
      v-if="isLoading || !!slots.icon"
      class="md-button__icon"
      slot-name="icon"
    >
      <MDLoadingIndicator v-if="isLoading" :label="props.label" :size="loadingIndicatorSize" />
      <slot v-else name="icon" />
    </MDButtonSlottedContent>
    <MDButtonSlottedContent
      v-if="!isLoading && !!slots['selected-icon']"
      class="md-button__icon"
      slot-name="selected-icon"
    >
      <slot name="selected-icon" />
    </MDButtonSlottedContent>
    <span class="md-button__label-text">{{ props.label }}</span>
    <MDButtonSlottedContent
      v-if="!!slots['selected-label']"
      class="md-button__label-text"
      slot-name="selected"
    >
      <slot name="selected-label" />
    </MDButtonSlottedContent>
  </m3e-button>
  <!-- eslint-enable vue/attribute-hyphenation -->
</template>

<style scoped>
.md-button {
  vertical-align: middle;
  position: relative;
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
</style>
