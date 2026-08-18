<script setup lang="ts">
import '@m3e/web/button';
import type {
  ButtonSize as RendererButtonSize,
  ButtonVariant as RendererButtonVariant,
  M3eButtonElement,
} from '@m3e/web/button';
// Documented transparent host/adaptor contract (ARCHITECTURE.md "Host-attribute
// boundary"): `useAttrs` is read-only here and feeds the explicit, family-scoped
// host-attribute allow-list below. It is never spread wholesale and is not a
// default forwarding escape hatch.
// eslint-disable-next-line no-restricted-imports -- see comment above.
import { computed, defineComponent, h, useAttrs } from 'vue';
import { MDLoadingIndicator } from '../loadingIndicator';
import './tokens.css';

defineOptions({ inheritAttrs: false });

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
     * indeterminate process. Takes precedence over the leading icon, which is
     * restored once loading ends. Do not use while completion is suspended on
     * browser, provider, or other user-controlled UI.
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

const attrs = useAttrs();

/**
 * Explicit host-attribute allow-list forwarded to the renderer root (see ARCHITECTURE.md
 * "Host-attribute boundary"): `id`, `title`, `aria-controls`, `aria-describedby`,
 * `aria-expanded`, `aria-haspopup`, and every `data-*` key are forwarded as-is. `class` and
 * `style` are merged separately in the template so the adapter-owned `md-button` class always
 * wins over a conflicting consumer value. `$attrs` is read-only; this builds a fresh object
 * rather than mutating it. Every other attribute or listener (renderer-private `toggle`,
 * `selected`, `shape`, `variant`, or an arbitrary listener such as `beforeinput`) is
 * intentionally not forwarded.
 *
 * Called directly from the template (not `computed()`): Vue guarantees `useAttrs()` reflects
 * the latest attrs during render, but does not guarantee that object is a supported reactive
 * `computed()` dependency, so this recomputes from the live `attrs` object on every render.
 * @returns The allow-listed subset of the current host attributes.
 */
const getForwardedAttrs = (): Record<string, unknown> => {
  const forwarded: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (
      key === 'id' ||
      key === 'title' ||
      key === 'aria-controls' ||
      key === 'aria-describedby' ||
      key === 'aria-expanded' ||
      key === 'aria-haspopup'
    ) {
      forwarded[key] = value;
    } else if (key.startsWith('data-')) {
      forwarded[key] = value;
    }
  }
  return forwarded;
};
</script>

<template>
  <!-- eslint-disable vue/attribute-hyphenation -- The m3e Boolean must be bound as a camel-case property; its dashed attribute would treat false as present. -->
  <!-- eslint-disable-next-line vue/no-undef-components -- m3e-button is selected by config/vueCustomElements.ts. -->
  <m3e-button
    v-bind="getForwardedAttrs()"
    :class="['md-button', attrs.class]"
    :style="attrs.style"
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
        class="md-button__loading-indicator"
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

.md-button__icon {
  display: inline-flex;
  color: inherit;
}

/*
 * Doubled selector (not a typo): this and Loading indicator's own tokens.css both
 * set `--md-comp-loading-indicator-active-indicator-color` at identical specificity
 * (one class + one Vue scope attribute), so the final bundle's CSS source order
 * decides the tie. Doubling the class raises this rule's specificity so Button's
 * `currentColor` composition deterministically wins instead of depending on build order.
 */
.md-button__loading-indicator.md-button__loading-indicator {
  --md-comp-loading-indicator-active-indicator-color: currentColor;
}
</style>
