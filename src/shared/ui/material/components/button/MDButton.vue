<script setup lang="ts">
import '@m3e/web/button';
import type {
  ButtonSize as RendererButtonSize,
  ButtonVariant as RendererButtonVariant,
  M3eButtonElement,
} from '@m3e/web/button';
import { computed, defineComponent, h } from 'vue';
import { MDLoadingIndicator } from '../loading-indicator';

const props = withDefaults(
  defineProps<{
    /** Native button type. Defaults to `button` to avoid accidental form submission. */
    nativeType?: 'button' | 'submit' | undefined;
    /** Material Button appearance. */
    color?: 'filled' | 'outlined' | 'text' | undefined;
    /** Visible label and accessible name. */
    label: string;
    /** Blocks focus and activation through the renderer's documented disabled contract. */
    disabled?: boolean | undefined;
    /** Material Button size. */
    size?: 'extra-small' | 'small' | undefined;
    /**
     * Shows a Material Loading indicator in place of the leading icon for a short
     * async action (Loading indicator placement guidance). Takes precedence over
     * the leading icon, which is restored once loading ends.
     */
    loading?: boolean | undefined;
  }>(),
  {
    color: 'filled',
    nativeType: 'button',
    size: 'small',
  },
);

const emit = defineEmits<{
  /** Stable action event normalized from the renderer host click. */
  click: [event: MouseEvent];
}>();

const slots = defineSlots<{
  /** Leading icon content. */
  icon(): unknown;
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

const isLoading = computed(() => !!props.loading);
const rendererVariant = computed<RendererButtonVariant>(() => props.color);
const rendererSize = computed<RendererButtonSize>(() => props.size);
const rendererType = computed<M3eButtonElement['type']>(() => props.nativeType);
/**
 * Mioframe Button-to-Loading-indicator composition mapping (not the official Loading
 * indicator size API, and not the Button icon-size tokens): both retained sizes map to 24.
 */
const loadingIndicatorSize = computed<number>(
  () =>
    ({
      'extra-small': 24,
      small: 24,
    })[props.size],
);

const onClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<template>
  <!-- eslint-disable vue/attribute-hyphenation -- The m3e Boolean must be bound as a camel-case property; its dashed attribute would treat false as present. -->
  <m3e-button
    class="md-button"
    :aria-busy="isLoading ? 'true' : undefined"
    :disabled="props.disabled"
    shape="rounded"
    :size="rendererSize"
    :toggle="false"
    :type="rendererType"
    :variant="rendererVariant"
    @click="onClick"
  >
    <MDButtonSlottedContent
      v-if="isLoading || !!slots.icon"
      class="md-button__icon"
      slot-name="icon"
    >
      <MDLoadingIndicator
        v-if="isLoading"
        aria-hidden="true"
        :label="props.label"
        :size="loadingIndicatorSize"
      />
      <slot v-else name="icon" />
    </MDButtonSlottedContent>
    <span class="md-button__label-text">{{ props.label }}</span>
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

/* m3e keeps its internal pressed feedback after release. While the host is physically active,
 * its documented pressed-shape input remains renderer-owned. Once :active clears, map that
 * input back to the selected resting round shape so only geometry releases immediately. */
.md-button:not(:active) {
  --m3e-button-extra-small-shape-pressed-morph: var(
    --m3e-button-extra-small-shape-round,
    var(--m3e-button-shape-round, 9999px)
  );
  --m3e-button-small-shape-pressed-morph: var(
    --m3e-button-small-shape-round,
    var(--m3e-button-shape-round, 9999px)
  );
}

.md-button__icon {
  display: inline-flex;
  color: inherit;
}
</style>
