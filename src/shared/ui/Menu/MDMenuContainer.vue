<script
  setup
  lang="ts"
  generic="K extends PropertyKey, T extends MenuButtonDescription"
>
import type { MaybeElement } from '@vueuse/core';
import type { StyleValue } from 'vue';
import { computed, toRef, useTemplateRef } from 'vue';
import { useElementBounding, useWindowSize } from '@vueuse/core';
import { MDListContainer } from '../Lists';
import type { MenuButtonDescription } from './types';
import MDMenusListItem from './MDMenusListItem.vue';
import { MDSymbol } from '../Icon';

const { targetRef } = defineProps<{
  targetRef: MaybeElement;
  btns?: Iterable<[K, T]>;
}>();

defineSlots<{
  default(): unknown;
}>();

const emit = defineEmits<{
  click: [key: K];
}>();

const onClick = (key: K) => {
  emit('click', key);
};

const rootEl = useTemplateRef('rootEl');

const {
  x: targetX,
  y: targetY,
  height: targetHeight,
  width: targetWidth,
} = useElementBounding(toRef(() => targetRef));

const { height: menusHeight, width: menusWidth } = useElementBounding(rootEl);

const { height: windowHeight, width: windowWidth } = useWindowSize();

const bottomSpace = computed(
  () => windowHeight.value - targetY.value - targetHeight.value,
);

const positionTop = computed((): `${number}px` => {
  const topSpace = targetY.value;

  if (menusHeight.value < bottomSpace.value || topSpace < bottomSpace.value) {
    return `${targetY.value + targetHeight.value}px`;
  }

  return `${Math.max(targetY.value - menusHeight.value, 0)}px`;
});

const maxHeight = computed((): `${number}px` => {
  const topSpace = targetY.value;

  if (menusHeight.value < bottomSpace.value || topSpace < bottomSpace.value) {
    return `${bottomSpace.value}px`;
  }

  return `${topSpace}px`;
});

const rightSpace = computed(() => windowWidth.value - targetX.value);

const leftSpace = computed(() => targetX.value + targetWidth.value);

const positionLeft = computed((): `${number}px` => {
  if (
    menusWidth.value < rightSpace.value ||
    leftSpace.value < rightSpace.value
  ) {
    return `${targetX.value}px`;
  }

  return `${Math.max(targetX.value + targetWidth.value - menusWidth.value, 0)}px`;
});

const style = computed((): StyleValue => {
  return {
    top: positionTop.value,
    left: positionLeft.value,
    maxHeight: maxHeight.value,
  };
});
</script>

<template>
  <MDListContainer ref="rootEl" tag="div" class="md-menus" :style="style">
    <slot>
      <MDMenusListItem
        v-for="[key, { symbolName, text }] in btns"
        :key
        :text
        @click="onClick(key)"
      >
        <template #leadingIcon>
          <MDSymbol :name="symbolName" />
        </template>
      </MDMenusListItem>
    </slot>
  </MDListContainer>
</template>

<style lang="css" scoped>
.md-menus {
  position: fixed;
  z-index: 1;
  overflow-y: auto;

  border-radius: var(--md-sys-shape-corner-extra-small);
  box-shadow: var(--md-sys-elevation-level2);
  --md-container-color: var(--md-sys-color-surface-container);
  display: flex;
  flex-direction: column;

  --md-list-container-border-radius: 0px;
}
</style>
