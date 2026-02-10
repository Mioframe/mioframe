<script setup lang="ts">
import { computed, toRef, toRefs, useTemplateRef, watch } from 'vue';
import { definePaneContainer } from './useMDContainer';
import { useDraggable, useElementBounding, useElementSize } from '@vueuse/core';
import { round } from 'es-toolkit';
import { useSplitLayoutContext } from './useSplitLayoutContext';
import { defineAllowedBottomNavigation } from './allowedBottomNavigation';

const props = defineProps<{
  allowBottomNavigation?: boolean;
}>();

const { allowBottomNavigation } = toRefs(props);

defineSlots<{
  default: () => unknown;
}>();

const paneEl = useTemplateRef<HTMLDivElement>('paneEl');
const resizeButton = useTemplateRef<HTMLButtonElement>('resizeButton');
const paneContentEl = useTemplateRef('paneContentEl');

definePaneContainer(paneContentEl);

const { x: resizeButtonX } = useDraggable(resizeButton, {
  axis: 'x',
  preventDefault: true,
  initialValue: {
    x: -1,
    y: -1,
  },
});

const { width: paneSizeWidth } = useElementSize(paneEl);

const paneWidth = computed({
  get: (): number | undefined => paneSizeWidth.value,
  set: (v) => {
    if (v && paneEl.value) {
      paneEl.value.style.setProperty('--md-pane-width', `${round(v)}px`);
    }
  },
});

const { left: paneLeft } = useElementBounding(paneEl);

const {
  numberOfPanes,
  bodyLeft: parentLeft,
  bodyWidth: parentWidth,
} = useSplitLayoutContext();

const indexPane = toRef(() => {
  if (paneEl.value?.parentElement?.children) {
    return Array.from(paneEl.value.parentElement.children).indexOf(
      paneEl.value,
    );
  }

  return undefined;
});

const minWidth = 320;

const maxWidth = computed(
  () =>
    parentWidth.value -
    (paneLeft.value - parentLeft.value) -
    minWidth * (numberOfPanes.value - ((indexPane.value ?? 0) + 1)),
);

const { width: resizeButtonWidth } = useElementSize(resizeButton, undefined, {
  box: 'border-box',
});

watch(
  [resizeButtonX, paneLeft, maxWidth, resizeButtonWidth],
  ([resizeButtonX, paneLeft, maxWidth, resizeButtonWidth]) => {
    if (resizeButtonX > 0) {
      paneWidth.value = Math.max(
        Math.min(resizeButtonX + resizeButtonWidth / 2 - paneLeft, maxWidth),
        minWidth,
      );
    }
  },
);

defineAllowedBottomNavigation(allowBottomNavigation);
</script>

<template>
  <div ref="paneEl" class="md-pane">
    <div ref="paneContentEl" class="md __content">
      <slot />
    </div>

    <button
      ref="resizeButton"
      class="__resize-button"
      type="button"
      aria-label="resize pane"
    />
  </div>
</template>

<style lang="css" scoped>
.md-pane {
  --md-pane-width: unset;
  --md-pane-resize-button-width: 5step;

  display: flex;
  flex-grow: 1;
  flex-shrink: 1;
  --md-container-color: var(--md-sys-color-surface);
  --md-content-color: var(--md-sys-color-on-surface);
  padding: 2step;
  position: relative;
  max-width: var(--md-pane-width);
  width: var(--md-pane-width);
  min-width: 320px;
  transition-property: none;

  &:last-of-type {
    max-width: unset;
    width: unset;

    .__resize-button {
      display: none;
    }
  }

  .__content {
    display: flex;
    overflow-y: auto;
    flex-direction: column;
    justify-content: flex-start;
    border-radius: var(--md-pane-container-shape, 16px);
    height: 100%;
    flex-grow: 1;
    flex-shrink: 1;
    padding: var(--md-pane-padding-y, 0) var(--md-pane-padding-x, 0);
  }

  .__resize-button {
    --height: 12step;
    position: absolute;
    z-index: 1;
    top: calc(50% - var(--height) / 2);
    left: calc(100% - var(--md-pane-resize-button-width) / 2);
    display: flex;
    height: var(--height);
    width: var(--md-pane-resize-button-width);
    cursor: col-resize;
    padding: 2step;
    background: transparent;
    border: 0;

    &::after {
      content: '';
      display: block;
      flex-grow: 1;
      border-radius: var(--md-sys-shape-corner-full);
      background-color: var(--md-sys-color-on-surface-variant);
    }

    &:hover {
      padding: 1step;
      &::after {
        background-color: var(--md-content-color);
      }
    }
  }
}
</style>
