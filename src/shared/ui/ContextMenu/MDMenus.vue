<script setup lang="ts">
import type { MaybeElement } from '@vueuse/core';
import type { StyleValue } from 'vue';
import { computed, ref, toRef } from 'vue';
import { useElementBounding, useWindowSize } from '@vueuse/core';
import MDMenusListItem from './MDMenusListItem.vue';
import { MDListContainer } from '../Lists';

const { targetRef } = defineProps<{
  targetRef: MaybeElement;
}>();

defineSlots<{
  default(): unknown;
}>();

const rootEl = ref<HTMLElement>();

const {
  x: targetX,
  y: targetY,
  height: targetHeight,
  width: targetWidth,
} = useElementBounding(toRef(() => targetRef));

const { height: menusHeight, width: menusWidth } = useElementBounding(rootEl);

const { height: windowHeight, width: windowWidth } = useWindowSize();

const positionTop = computed((): `${number}px` => {
  const bottomSpace = windowHeight.value - targetY.value - targetHeight.value;
  const topSpace = targetY.value;

  if (menusHeight.value < bottomSpace || topSpace < bottomSpace) {
    return `${targetY.value + targetHeight.value}px`;
  }

  return `${Math.max(targetY.value - menusHeight.value, 0)}px`;
});

const positionLeft = computed((): `${number}px` => {
  const rightSpace = windowWidth.value - targetX.value;
  const leftSpace = targetX.value + targetWidth.value;

  if (menusWidth.value < rightSpace || leftSpace < rightSpace) {
    return `${targetX.value}px`;
  }

  return `${Math.max(targetX.value + targetWidth.value - menusWidth.value, 0)}px`;
});

const style = computed((): StyleValue => {
  return {
    top: positionTop.value,
    left: positionLeft.value,
  };
});
</script>

<template>
  <MDListContainer ref="rootEl" tag="div" class="md-menus" :style="style">
    <slot>
      <MDMenusListItem text="Item 1" />

      <MDMenusListItem text="Item 2" />

      <MDMenusListItem text="Item 3" />

      <MDMenusListItem text="Item 4" />
    </slot>
  </MDListContainer>
</template>

<style lang="css" scoped>
.md-menus {
  position: fixed;
  z-index: 1;

  border-radius: var(--md-sys-shape-corner-extra-small);
  box-shadow: var(--md-sys-elevation-level2);
  --md-container-color: var(--md-sys-color-surface-container);
}
</style>
