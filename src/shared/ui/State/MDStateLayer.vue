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
      :drag="!props.disabled && props.dragged"
    />

    <span class="md-state-layer__target" />
  </span>
</template>

<style lang="css" scoped>
.md-state-layer {
  --md-state-layer-bounds-width: 100%;
  --md-state-layer-bounds-height: 100%;
  --md-state-target-offset: var(--md-target-offset, 4px);
  --md-state-target-width: max(
    calc(var(--md-state-layer-bounds-width) + var(--md-state-target-offset) * 2),
    var(--md-target-max-width, 48px)
  );
  --md-state-target-height: max(
    calc(var(--md-state-layer-bounds-height) + var(--md-state-target-offset) * 2),
    var(--md-target-max-height, 48px)
  );

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
  width: var(--md-state-layer-bounds-width);
  height: var(--md-state-layer-bounds-height);
  z-index: 0;
}

.md-state-layer__target {
  position: absolute;
  z-index: 0;
  width: var(--md-state-target-width);
  height: var(--md-state-target-height);
  border-radius: inherit;
  background: transparent;
  top: calc(var(--md-state-layer-bounds-height) / 2);
  left: calc(var(--md-state-layer-bounds-width) / 2);
  transform: translate(-50%, -50%);
}
</style>
