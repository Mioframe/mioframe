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
     * Official binary selection state (unselected/off vs. selected/on). Controlled
     * one-directionally: this prop is the sole source of truth and is always written into the
     * renderer's `checked` property. A real user activation never mutates `checked` as a side
     * effect of the interaction itself; the renderer's cancelable `beforeinput` intent is
     * intercepted and cancelled before any renderer mutation, and `update:selected` carries the
     * intended next value for the owning consumer to write back.
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
   * Fired from the renderer's own cancelable `beforeinput` intent, before any renderer mutation:
   * carries the *intended* next value (`!event.target.checked`, computed pre-mutation), not a
   * value read back after the fact, for a `v-model:selected`-style controlled binding. Never
   * fires while `presentation` is true, since the handler no-ops before computing or emitting
   * anything in that mode, and is never reachable while `disabled` is true, since the renderer's
   * own guard blocks `beforeinput` dispatch before it can occur.
   */
  'update:selected': [value: boolean];
}>();

/**
 * Intercepts the renderer's cancelable `beforeinput` intent before any renderer mutation can
 * occur (ARCHITECTURE.md "State precedence and restoration"). `presentation` no-ops first — no
 * `preventDefault()`, no emit — as defense-in-depth alongside the host suppression attributes.
 * Otherwise `preventDefault()` is called before computing the intended next value, which stops
 * the renderer's own pending `checked` mutation from ever executing; `selected` remains the sole
 * source of truth via the one-way `:checked="props.selected"` binding below. Deliberately does
 * not check `props.disabled` itself: the renderer's own click handler already blocks `beforeinput`
 * dispatch before `disabled` before this listener could run, so a redundant wrapper-level check
 * would only mask a real renderer regression instead of catching one.
 * @param event - The renderer's cancelable `beforeinput` event.
 */
const onBeforeinput = (event: Event) => {
  if (!(event.target instanceof M3eSwitchElement)) {
    return;
  }
  if (props.presentation) {
    return;
  }
  event.preventDefault();
  emit('update:selected', !event.target.checked);
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
    @beforeinput="onBeforeinput"
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
