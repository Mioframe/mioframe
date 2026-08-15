<script setup lang="ts">
import '@m3e/web/fab';
import type {
  FabSize as RendererFabSize,
  FabVariant as RendererFabVariant,
  M3eFabElement,
} from '@m3e/web/fab';
// Documented transparent host/adaptor contract (ARCHITECTURE.md "Host-attribute
// boundary"/"Public Vue API"): `useAttrs` is read-only here and feeds the explicit,
// family-scoped host-attribute allow-list below. It is never spread wholesale and is not a
// default forwarding escape hatch.
// eslint-disable-next-line no-restricted-imports -- see comment above.
import { onMounted, useAttrs, useTemplateRef, warn } from 'vue';

defineOptions({ inheritAttrs: false });

const props = defineProps<{
  /**
   * The Extended FAB's required visible label text. Rendered as light-DOM text projected into
   * the renderer's named `label` slot, and explicitly mirrored to the host `aria-label` so it
   * also doubles as the accessible action name (ARCHITECTURE.md "Public Vue API"), matching
   * `floatingActionButton`'s browser-proven explicit-`aria-label` pattern rather than relying on
   * unverified renderer shadow-tree content-based accessible-name aggregation.
   */
  label: string;
}>();

const emit = defineEmits<{
  /** Forwards the renderer host's native click unchanged. */
  click: [event: MouseEvent];
}>();

defineSlots<{
  /**
   * Optional decorative Extended FAB icon. When present, it must render exactly one direct
   * inline `<svg>` root with a `viewBox`, no `slot` attribute, `aria-hidden="true"`, no focusable
   * or interactive descendant, and paint based on `currentColor` — identical contract to
   * `floatingActionButton`'s `#icon` slot, including the filled-not-outlined Material-compatible
   * artwork requirement from DESIGN.md's "Anatomy and content" guidance. The SVG may come from
   * inline markup or a Vue helper whose rendered root is that SVG. Text, wrappers, images,
   * renderer elements, and additional visible labels are unsupported. Omitting the slot renders
   * the Extended FAB label-only, matching official anatomy (icon optional, label mandatory).
   */
  icon?(): unknown;
}>();

const hostElement = useTemplateRef<M3eFabElement>('hostElement');

/**
 * Adapter-owned private renderer constants (ARCHITECTURE.md "Selected and deferred Material
 * surface"/"Public Vue API"): small is the officially recommended baseline-replacement size and
 * also `RepoExplorerPane`'s current effective configuration; primary-container is both the
 * documented Material default color mapping and `RepoExplorerPane`'s current effective
 * configuration; `extended` is always `true` so the renderer composes the Extended FAB anatomy
 * (icon + collapsible label wrapper) rather than the plain FAB anatomy. Typed against the
 * exported renderer unions so a future renderer rename fails type-check instead of silently
 * drifting. Never settable by a consumer.
 */
const rendererSize: RendererFabSize = 'small';
const rendererVariant: RendererFabVariant = 'primary-container';
const rendererExtended = true;

const onClick = (event: MouseEvent) => {
  emit('click', event);
};

const attrs = useAttrs();

/**
 * Assigns the rendered label text to the renderer's named `label` slot (see template): the
 * native HTML `slot` global attribute is how light-DOM content is routed to a named shadow-DOM
 * slot, matching the shipped `FabElement.d.ts` worked example
 * (`<span slot="label">Add</span>`). Vue's `HTMLAttributes` type does not declare `slot` as a
 * bindable attribute (it is reserved for Vue's own `v-slot` API on components, not plain
 * elements), so this is built as an untyped record and spread via `v-bind`, the same escape
 * hatch `getForwardedAttrs()` already uses for the host element above — not a new pattern.
 */
const labelSlotAttrs: Record<string, unknown> = { slot: 'label' };

/**
 * Explicit host-attribute allow-list forwarded to the renderer root (see ARCHITECTURE.md "Public
 * Vue API"): `id`, `title`, and every `data-*` key are forwarded as-is. `class` and `style` are
 * merged separately in the template so the adapter-owned `md-extended-fab` class always wins over
 * a conflicting consumer value. `$attrs` is read-only; this builds a fresh object rather than
 * mutating it. Every other attribute or listener (renderer-private `disabled`,
 * `disabled-interactive`, `variant`, `size`, `lowered`, `extended`, `aria-label`, link/form
 * attributes, or an arbitrary listener) is intentionally not forwarded.
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
    // Only the icon slot's projected content is validated here. The required `label` slot's own
    // light-DOM child always carries an explicit `slot="label"` attribute (see template), which
    // distinguishes it from the default-slotted icon content — unlike `floatingActionButton`,
    // where every host child is icon content because that family has no label slot.
    const iconContent = [...(hostElement.value?.childNodes ?? [])].filter((node) => {
      if (node instanceof Element && node.getAttribute('slot') === 'label') {
        return false;
      }
      return node.nodeType !== Node.TEXT_NODE || Boolean(node.textContent?.trim());
    });
    if (iconContent.length === 0) {
      // Omitted icon is valid per official anatomy (icon optional, label mandatory); no warning.
      return;
    }
    const [icon] = iconContent;
    if (
      iconContent.length !== 1 ||
      !(icon instanceof SVGSVGElement) ||
      icon.namespaceURI !== 'http://www.w3.org/2000/svg'
    ) {
      warn(
        'MDExtendedFab: the `icon` slot must render exactly one direct inline SVG root when provided.',
      );
    }
  });
}
</script>

<template>
  <!-- eslint-disable-next-line vue/no-undef-components -- m3e-fab is selected by config/vueCustomElements.ts. -->
  <m3e-fab
    ref="hostElement"
    v-bind="getForwardedAttrs()"
    :class="['md-extended-fab', attrs.class]"
    :style="attrs.style"
    :aria-label="props.label"
    :size="rendererSize"
    :variant="rendererVariant"
    :extended="rendererExtended"
    @click="onClick"
  >
    <slot name="icon" />
    <span v-bind="labelSlotAttrs">{{ label }}</span>
  </m3e-fab>
</template>

<style scoped>
.md-extended-fab {
  vertical-align: middle;
}
</style>
