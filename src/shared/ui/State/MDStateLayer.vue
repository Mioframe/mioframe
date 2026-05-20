<script setup lang="ts">
import MDLayer from './MDLayer.vue';

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
</script>

<template>
  <span class="md-state-layer" aria-hidden="true">
    <MDLayer
      class="md-state-layer__layer"
      :hover="!props.disabled && props.hover"
      :focused="!props.disabled && props.focused"
      :pressed="!props.disabled && props.pressed"
      :dragged="!props.disabled && props.dragged"
    />
  </span>
</template>

<style lang="css" scoped>
.md-state-layer {
  position: absolute;
  inset: 0;
  display: block;
  pointer-events: none;
  border-radius: inherit;
}

.md-state-layer__layer {
  position: absolute;
  inset: 0;
  display: block;
  z-index: 0;
}
</style>
