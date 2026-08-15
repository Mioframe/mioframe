<script setup lang="ts">
import '@m3e/web/fab';
import type {
  FabSize as RendererFabSize,
  FabVariant as RendererFabVariant,
  M3eFabElement,
} from '@m3e/web/fab';
// Documented transparent host/adaptor contract (ARCHITECTURE.md "Host-attribute
// boundary"): `useAttrs` is read-only here and feeds the explicit, family-scoped
// host-attribute allow-list below. It is never spread wholesale and is not a
// default forwarding escape hatch.
// eslint-disable-next-line no-restricted-imports -- see comment above.
import { onMounted, useAttrs, useTemplateRef, warn } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  /**
   * The FAB's required accessible action label, for example "Compose a new message". Maps
   * directly to the host `aria-label`. It is **not** rendered as visible text — the FAB anatomy
   * carries no label content; a visible label belongs to the separate Extended FAB family.
   */
  label: string;
}>();

const emit = defineEmits<{
  /** Forwards the renderer host's native click unchanged. */
  click: [event: MouseEvent];
}>();

defineSlots<{
  /**
   * Required FAB icon. It must render exactly one direct inline `<svg>` root with a `viewBox`,
   * no `slot` attribute, `aria-hidden="true"`, no focusable or interactive descendant, and paint
   * based on `currentColor`. Per official guidance ("the icon should be clear and understandable,
   * and should use a filled icon rather than an outlined one"), the artwork itself must be
   * filled, Material-compatible iconography — a solid shape, not outlined/stroke-only artwork.
   * This filled-versus-outlined requirement is a caller contract enforced by fixture selection
   * and review, not by runtime SVG-shape/semantic validation. Text, wrappers, images, renderer
   * elements, and visible labels are unsupported. The SVG may come from inline markup or a Vue
   * helper whose rendered root is that SVG.
   */
  icon(): unknown;
}>();

const hostElement = useTemplateRef<M3eFabElement>('hostElement');

/**
 * Adapter-owned private renderer constants (ARCHITECTURE.md "Selected and deferred Material
 * surface"): medium is Material's most-recommended size for general use (not a documented
 * default size), and primary-container is the documented Material default color mapping;
 * `medium` also happens to be the independent `@m3e/web@2.7.4` renderer default size input.
 * Typed against the exported renderer unions so a future renderer rename fails type-check
 * instead of silently drifting. Never settable by a consumer.
 */
const rendererVariant: RendererFabVariant = 'primary-container';
const rendererSize: RendererFabSize = 'medium';

const onClick = (event: MouseEvent) => {
  emit('click', event);
};

const attrs = useAttrs();

/**
 * Explicit host-attribute allow-list forwarded to the renderer root (see ARCHITECTURE.md
 * "Host-attribute boundary"): `id`, `title`, and every `data-*` key are forwarded as-is. `class`
 * and `style` are merged separately in the template so the adapter-owned `md-fab` class always
 * wins over a conflicting consumer value. `$attrs` is read-only; this builds a fresh object
 * rather than mutating it. Every other attribute or listener (renderer-private `disabled`,
 * `disabled-interactive`, `variant`, `size`, `lowered`, `extended`, link/form attributes, or an
 * arbitrary listener) is intentionally not forwarded.
 *
 * Called directly from the template (not `computed()`): Vue guarantees `useAttrs()` reflects the
 * latest attrs during render, but does not guarantee that object is a supported reactive
 * `computed()` dependency, so this recomputes from the live `attrs` object on every render.
 * @returns The allow-listed subset of the current host attributes.
 */
const getForwardedAttrs = (): Record<string, unknown> => {
  const forwarded: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'id' || key === 'title') {
      forwarded[key] = value;
    } else if (key.startsWith('data-')) {
      forwarded[key] = value;
    }
  }
  return forwarded;
};

if (import.meta.env.DEV) {
  onMounted(() => {
    const children = [...(hostElement.value?.childNodes ?? [])].filter(
      (node) => node.nodeType !== Node.TEXT_NODE || node.textContent?.trim(),
    );
    const [icon] = children;
    if (
      children.length !== 1 ||
      !(icon instanceof SVGSVGElement) ||
      icon.namespaceURI !== 'http://www.w3.org/2000/svg'
    ) {
      warn('MDFab: the `icon` slot must render exactly one direct inline SVG root.');
    }
  });
}
</script>

<template>
  <!-- eslint-disable-next-line vue/no-undef-components -- m3e-fab is selected by config/vueCustomElements.ts. -->
  <m3e-fab
    ref="hostElement"
    v-bind="getForwardedAttrs()"
    :class="['md-fab', attrs.class]"
    :style="attrs.style"
    :aria-label="props.label"
    :size="rendererSize"
    :variant="rendererVariant"
    @click="onClick"
  >
    <slot name="icon" />
  </m3e-fab>
</template>

<style scoped>
.md-fab {
  vertical-align: middle;
}
</style>
