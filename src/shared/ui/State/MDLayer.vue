<script setup lang="ts">
defineProps<{
  hover?: boolean;
  pressed?: boolean;
  focused?: boolean;
  dragged?: boolean;
}>();
</script>

<template>
  <span
    class="md-layer"
    :class="{
      _hover: hover,
      _pressed: pressed,
      _focused: focused,
      _dragged: dragged,
    }"
  />
</template>

<style lang="css" scoped>
.md-layer {
  display: block;
  border-radius: inherit;
  background: none;
  background-color: rgb(from var(--md-content-color) r g b / 0);
  transition-property: background, background-color;
  transition-duration: var(--md-sys-motion-duration-short4, 0.2s);

  &._hover {
    will-change: background-color;

    background-color: rgb(
      from var(--md-content-color) r g b / var(--md-state-hover-layer-opacity, 0.08)
    );
  }
  &._pressed {
    background-color: rgb(
      from var(--md-content-color) r g b / var(--md-state-pressed-layer-opacity, 0.1)
    );
  }
  &._focused {
    background-color: rgb(
      from var(--md-content-color) r g b / var(--md-state-focus-layer-opacity, 0.1)
    );
  }
  &._dragged {
    background-color: rgb(
      from var(--md-content-color) r g b / var(--md-state-dragged-layer-opacity, 0.16)
    );
  }
}
</style>
