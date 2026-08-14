<script setup lang="ts">
import '@m3e/web/fab';
import type { FabSize as RendererFabSize, FabVariant as RendererFabVariant } from '@m3e/web/fab';
// Documented transparent host/adaptor contract (ARCHITECTURE.md "Host-attribute
// boundary"): `useAttrs` is read-only here and feeds the explicit, family-scoped
// host-attribute allow-list below. It is never spread wholesale and is not a
// default forwarding escape hatch.
// eslint-disable-next-line no-restricted-imports -- see comment above.
import { onMounted, useAttrs, useSlots, warn } from 'vue';

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
  /** Required icon content rendered as the FAB's only content. */
  icon(): unknown;
}>();

// `useSlots()`, not the `defineSlots()` return value, for the DEV-mode emptiness check below:
// `useSlots()` types every slot as possibly `undefined` at runtime, matching the legacy
// `MDFab`'s existing warning convention, while `defineSlots()`'s typed return models the public
// slot contract (always present once provided) for template/type-checking purposes.
const slots = useSlots();

/**
 * Adapter-owned private renderer constants (ARCHITECTURE.md "Selected and deferred Material
 * surface"): medium size and primary-container color are the only official standalone default
 * this family selects. Typed against the exported renderer unions so a future renderer rename
 * fails type-check instead of silently drifting. Never settable by a consumer.
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
    if (!slots.icon) {
      warn('MDFab: provide an icon via the `icon` slot. A FAB requires an icon.');
    }
  });
}
</script>

<template>
  <!-- eslint-disable-next-line vue/no-undef-components -- m3e-fab is selected by config/vueCustomElements.ts. -->
  <m3e-fab
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
