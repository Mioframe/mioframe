<script setup lang="ts">
import { computed } from 'vue';
import { useMDStateLayerForcedState } from './testing/forcedState';

const props = withDefaults(
  defineProps<{
    hover?: boolean | undefined;
    focused?: boolean | undefined;
    pressed?: boolean | undefined;
    dragged?: boolean | undefined;
    disabled?: boolean | undefined;
  }>(),
  {
    hover: false,
    focused: false,
    pressed: false,
    dragged: false,
    disabled: false,
  },
);

// Story/test-only override: a forced field wins over the real runtime prop
// only when explicitly injected. Without a provider, this is a no-op and
// runtime behavior is unchanged.
const forcedState = useMDStateLayerForcedState();

const effectiveHover = computed(() => forcedState?.hovered?.value ?? props.hover);
const effectiveFocused = computed(() => forcedState?.focused?.value ?? props.focused);
const effectivePressed = computed(() => forcedState?.pressed?.value ?? props.pressed);
const effectiveDragged = computed(() => forcedState?.dragged?.value ?? props.dragged);
</script>

<template>
  <span
    class="md-state-layer"
    :class="{
      'md-state_hover': !props.disabled && effectiveHover,
      'md-state_focused': !props.disabled && effectiveFocused,
      'md-state_pressed': !props.disabled && effectivePressed,
      'md-state_dragged': !props.disabled && effectiveDragged,
      'md-state_disabled': props.disabled,
    }"
    aria-hidden="true"
  />
</template>

<style lang="css" scoped>
.md-state-layer {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
  border-radius: inherit;
  z-index: 0;
  background: none;
  background-color: rgb(from var(--md-content-color) r g b / 0);
  transition-property: background, background-color;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);

  &.md-state_hover,
  :global(.md-state_hover) > & {
    will-change: background-color;
    background-color: rgb(
      from var(--md-content-color) r g b / var(--md-state-hover-layer-opacity, 0.08)
    );
  }

  &.md-state_focused,
  :global(.md-state_focused) > & {
    background-color: rgb(
      from var(--md-content-color) r g b / var(--md-state-focus-layer-opacity, 0.1)
    );
  }

  &.md-state_pressed,
  :global(.md-state_pressed) > & {
    background-color: rgb(
      from var(--md-content-color) r g b / var(--md-state-pressed-layer-opacity, 0.1)
    );
  }

  &.md-state_dragged,
  :global(.md-state_dragged) > & {
    background-color: rgb(
      from var(--md-content-color) r g b / var(--md-state-dragged-layer-opacity, 0.16)
    );
  }

  &.md-state_disabled,
  :global(.md-state_disabled) > &,
  :global(:disabled) > &,
  :global([aria-disabled='true']) > & {
    background-color: rgb(from var(--md-content-color) r g b / 0);
  }
}
</style>
