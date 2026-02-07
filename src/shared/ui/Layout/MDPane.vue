<script setup lang="ts">
import { computed, useTemplateRef, watch } from 'vue';
import { useProvidePaneContainer } from './useMDContainer';
import { useCssVar, useDraggable } from '@vueuse/core';
import { round } from 'es-toolkit';
import { toNumber } from 'es-toolkit/compat';

defineSlots<{
  default: () => unknown;
}>();

const el = useTemplateRef<HTMLDivElement>('el');
const resizeButton = useTemplateRef<HTMLButtonElement>('resizeButton');

useProvidePaneContainer(el);

const parentContainer = computed(() => el.value?.parentElement);

const { x: resizeButtonX } = useDraggable(resizeButton, {
  axis: 'x',
  preventDefault: true,
  containerElement: parentContainer,
});

const mdPaneWidthCssVar = useCssVar('--md-pane-width', el, {
  initialValue: el.value ? `${el.value.clientWidth}px` : undefined,
});

const paneWidth = computed({
  get: (): number | undefined => toNumber(mdPaneWidthCssVar.value) || undefined,
  set: (v) => {
    if (v) {
      mdPaneWidthCssVar.value = `${round(v)}px`;
    }
  },
});

watch(resizeButtonX, (resizeButtonX) => {
  paneWidth.value = resizeButtonX;
});
</script>

<template>
  <div ref="el" class="md-pane">
    <div class="md __content">
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
  max-width: calc(
    var(--md-pane-width) + var(--md-pane-resize-button-width) / 2
  );
  width: calc(var(--md-pane-width) + var(--md-pane-resize-button-width) / 2);
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
