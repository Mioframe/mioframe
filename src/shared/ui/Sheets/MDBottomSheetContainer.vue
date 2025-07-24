<script setup lang="ts">
import {
  tryOnBeforeUnmount,
  useCssVar,
  useScroll,
  useWindowSize,
} from '@vueuse/core';
import { isBoolean } from 'es-toolkit';
import { computed, toRefs, useTemplateRef, watch, watchEffect } from 'vue';

const props = withDefaults(
  defineProps<{
    width?: number;
    collapsed?: boolean | undefined;
  }>(),
  { collapsed: undefined },
);

const { width, collapsed: collapsedProp } = toRefs(props);

const modelFullscreen = defineModel<boolean>('fullscreen', {
  default: undefined,
});

const emit = defineEmits<{
  'update:collapsed': [boolean];
}>();

defineSlots<{
  default(): unknown;
}>();

const containerEl = useTemplateRef('containerEl');

const { arrivedState: containerArrivedState, y: containerScrollY } =
  useScroll(containerEl);

const sheetWidthCssVar = useCssVar('--md-bottom-sheet-width', containerEl);

watchEffect(() => {
  sheetWidthCssVar.value = width.value ? `${width.value}px` : undefined;
});

const headerEl = useTemplateRef('headerEl');

const onClickDragHandle = () => {
  if (containerEl.value instanceof Element) {
    if (collapsedState.value) {
      const firstSection = headerEl.value?.nextElementSibling;

      if (firstSection instanceof Element) {
        firstSection.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    } else {
      containerEl.value.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
};

const collapsedState = computed(() => containerArrivedState.top);

const { height: windowHeight } = useWindowSize();

const fullscreen = computed(
  () => containerScrollY.value >= windowHeight.value - 28,
);

watch(fullscreen, (fullscreen) => {
  modelFullscreen.value = fullscreen;
});

watchEffect(() => {
  if (containerEl.value instanceof Element && isBoolean(collapsedProp.value)) {
    if (collapsedProp.value) {
      containerEl.value.scrollTo({
        top: 0,
        behavior: 'smooth',
      });
    } else {
      const firstSection = headerEl.value?.nextElementSibling;

      if (firstSection instanceof Element) {
        firstSection.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }
    }
  }
});

watch(collapsedState, (collapsed) => {
  if (collapsedProp.value !== collapsed) {
    emit('update:collapsed', collapsed);
  }
});

tryOnBeforeUnmount(() => {
  if (containerEl.value instanceof Element) {
    containerEl.value.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
});
</script>

<template>
  <div
    ref="containerEl"
    class="md md-bottom-sheet-container"
    :class="{
      'mb-bottom-sheet-container_collapsed': collapsedState,
      'mb-bottom-sheet-container_fullscreen': fullscreen,
    }"
  >
    <div ref="headerEl" class="md-bottom-sheet-container__header md">
      <button
        type="button"
        class="md md-bottom-sheet-container__drag-handle"
        @click="onClickDragHandle"
      />
    </div>

    <slot />
  </div>
</template>

<style lang="css" scoped>
.md-bottom-sheet-container {
  --md-bottom-sheet-width: unset;
  --md-bottom-sheet-min-height: 0px;
  --md-bottom-sheet-border-radius: var(--md-sys-shape-corner-extra-large-top);
  --md-bottom-sheet-shadow: var(--md-sys-elevation-level1);
  --md-bottom-sheet-container-color: var(--md-sys-color-surface-container-low);

  --offset-for-shadow: 100px;

  height: 100dvh;
  width: calc((var(--md-bottom-sheet-width) + var(--offset-for-shadow) * 2));
  position: fixed;
  z-index: 1;
  top: 0;
  overflow-y: auto;
  scroll-snap-type: y proximity;
  scroll-behavior: smooth;
  padding: 0 var(--offset-for-shadow);
  margin: 0 calc(var(--offset-for-shadow) * -1);
  box-sizing: border-box;
  scrollbar-width: none;
  pointer-events: none;
  background-color: transparent;
  overscroll-behavior-y: none;
  display: flex;
  flex-direction: column;
  align-items: center;

  &::before {
    content: '';
    display: block;
    height: calc(100dvh - var(--md-bottom-sheet-min-height) - 28px);
    flex-shrink: 0;
    scroll-snap-align: start;
  }

  &::after {
    content: '';
    display: block;
    position: absolute;
    height: 28px;
    box-shadow: var(--md-bottom-sheet-shadow);
    border-radius: var(--md-bottom-sheet-border-radius);
    transition-duration: var(--md-sys-motion-duration-short4);
    transition-property: border-radius;

    flex-shrink: 0;
    top: calc(100dvh - var(--md-bottom-sheet-min-height) - 28px);
    max-width: 640px;
    width: calc(100% - var(--offset-for-shadow) * 2);
    z-index: -1;
  }

  &__drag-handle {
    padding: 12px;
    margin: auto;
    display: block;
    border: 0;
    &::after {
      content: '';
      display: block;
      background-color: rgb(
        from var(--md-sys-color-on-surface-variant) r g b / 0.4
      );
      width: 32px;
      height: 4px;
      border-radius: 2px;
    }
  }

  &__header {
    border-radius: var(--md-bottom-sheet-border-radius);
    position: sticky;
    top: 0;
    z-index: 1;
    --md-container-color: var(--md-bottom-sheet-container-color);
    max-width: 640px;
    width: 100%;
    pointer-events: all;
  }

  &.mb-bottom-sheet-container_fullscreen {
    --md-bottom-sheet-border-radius: 0;
  }
}
</style>
