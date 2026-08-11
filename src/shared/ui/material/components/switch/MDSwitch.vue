<script setup lang="ts">
import { M3eSwitchElement } from '@m3e/web/switch';
// Documented transparent host/adaptor contract (ARCHITECTURE.md "Host-attribute
// boundary"): `useAttrs` is read-only here and feeds the explicit, family-scoped
// host-attribute allow-list below. It is never spread wholesale and is not a
// default forwarding escape hatch.
// eslint-disable-next-line no-restricted-imports -- see comment above.
import { computed, useAttrs } from 'vue';

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    /**
     * Official binary selection state (unselected/off vs. selected/on). Controlled: maps to the
     * renderer's `checked` property; a native toggle re-emits the renderer's resulting value
     * through `update:selected` rather than being owned internally by the renderer.
     */
    selected?: boolean | undefined;
    /**
     * Blocks the renderer's native click/keyboard toggle handling. Has no effect when
     * `presentation` is true (already fully non-interactive).
     */
    disabled?: boolean | undefined;
    /**
     * Mioframe composition extension, not an official Switch surface. Renders a purely
     * decorative, non-interactive visual (`tabindex="-1"`, `aria-hidden="true"`, host
     * `pointer-events: none`) for composition inside an owner that already provides the
     * accessible switch role, `aria-checked`, and the click-driven toggle action.
     * `selected`/`disabled` still control the rendered visual.
     */
    presentation?: boolean | undefined;
  }>(),
  {
    disabled: false,
    presentation: false,
    selected: false,
  },
);

const emit = defineEmits<{
  /**
   * Fired when the renderer's own click/keyboard toggle changes its internal `checked` value;
   * carries that resulting value for a `v-model:selected`-style controlled binding. Never fires
   * while `presentation` is true, since no interaction can reach the renderer in that mode.
   */
  'update:selected': [value: boolean];
}>();

const onChange = (event: Event) => {
  if (props.presentation) {
    return;
  }
  if (!(event.target instanceof M3eSwitchElement)) {
    return;
  }
  emit('update:selected', event.target.checked);
};

const attrs = useAttrs();

/**
 * Presentation-owned suppression attributes (ARCHITECTURE.md "State precedence and
 * restoration"). Built as a conditionally empty object, not string/number-typed props set to
 * `undefined`, so the non-presentation case omits the keys entirely rather than passing an
 * explicit `undefined` value the renderer's typed host props do not accept.
 */
const presentationAttrs = computed<Record<string, string | number>>(() =>
  props.presentation ? { 'aria-hidden': 'true', tabindex: -1 } : {},
);

/**
 * Explicit host-attribute allow-list forwarded to the renderer root (see ARCHITECTURE.md
 * "Host-attribute boundary"): `id`, `title`, `aria-label`, `aria-labelledby`, and every
 * `data-*` key are forwarded as-is. `class` and `style` are merged separately in the template
 * so the adapter-owned `md-switch` class always wins over a conflicting consumer value. `$attrs`
 * is read-only; this builds a fresh object rather than mutating it. Every other attribute or
 * listener (renderer-private `icons`, `name`, `value`, raw `checked`, or an arbitrary listener)
 * is intentionally not forwarded.
 *
 * Called directly from the template (not `computed()`): Vue guarantees `useAttrs()` reflects the
 * latest attrs during render, but does not guarantee that object is a supported reactive
 * `computed()` dependency, so this recomputes from the live `attrs` object on every render.
 * @returns The allow-listed subset of the current host attributes.
 */
const getForwardedAttrs = (): Record<string, unknown> => {
  const forwarded: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'id' || key === 'title' || key === 'aria-label' || key === 'aria-labelledby') {
      forwarded[key] = value;
    } else if (key.startsWith('data-')) {
      forwarded[key] = value;
    }
  }
  return forwarded;
};

/**
 * Merges the forwarded host-attribute allow-list with the presentation-owned suppression
 * attributes for a single `v-bind`. Kept as a function call (not an inline template object
 * literal) so the template stays free of a bare object-literal expression node; see
 * `getForwardedAttrs` for why this recomputes on every render instead of a `computed()`.
 * @returns The combined attrs object bound to the renderer root.
 */
const getMergedAttrs = (): Record<string, unknown> => ({
  ...getForwardedAttrs(),
  ...presentationAttrs.value,
});
</script>

<template>
  <!-- eslint-disable-next-line vue/no-undef-components -- m3e-switch is selected by config/vueCustomElements.ts. -->
  <m3e-switch
    v-bind="getMergedAttrs()"
    :class="['md-switch', { 'md-switch_presentation': props.presentation }, attrs.class]"
    :style="attrs.style"
    :checked="props.selected"
    :disabled="props.disabled"
    @change="onChange"
  />
</template>

<style scoped>
.md-switch {
  vertical-align: middle;
}

.md-switch_presentation {
  pointer-events: none;
}
</style>
