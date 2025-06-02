<script setup lang="ts">
import { useCssVar, useElementBounding, useElementSize } from '@vueuse/core';
import { ref, watchEffect } from 'vue';
import FixedPlaceholder from '../Layers/FixedPlaceholder.vue';

defineSlots<{
  head(): unknown;
  default(): unknown;
}>();

const placeholderEl = ref<HTMLDivElement>();
const headEl = ref<HTMLDivElement>();
const scrimEl = ref<HTMLDivElement>();

const headHeightCssVar = useCssVar(
  '--md-bottom-sheet-head-height',
  placeholderEl,
);
const placeholderWidthCssVar = useCssVar(
  '--md-bottom-sheet-placeholder-width',
  scrimEl,
);
const placeholderBottomCssVar = useCssVar(
  '--md-bottom-sheet-placeholder-bottom',
  scrimEl,
);

const placeholderTopCssVar = useCssVar(
  '--md-bottom-sheet-placeholder-top',
  scrimEl,
);

const { height: headHeight } = useElementSize(headEl);

const {
  bottom: placeholderBottom,
  width: placeholderWidth,
  top: placeholderTop,
} = useElementBounding(placeholderEl, { immediate: true });

watchEffect(() => {
  placeholderWidthCssVar.value = `${placeholderWidth.value}px`;
});

watchEffect(() => {
  headHeightCssVar.value = `${headHeight.value}px`;
});

watchEffect(() => {
  placeholderBottomCssVar.value = `${placeholderBottom.value}px`;
});
watchEffect(() => {
  placeholderTopCssVar.value = `${placeholderTop.value}px`;
});
</script>

<template>
  <div ref="placeholderEl" class="md-bottom-sheet">
    <FixedPlaceholder priority-height="content" priority-width="placeholder">
      <div ref="scrimEl" class="md md-bottom-sheet__scrim">
        <div class="md md-bottom-sheet__container">
          <div ref="headEl" class="md-bottom-sheet__head">
            <button type="button" class="md md-bottom-sheet__drag-handle" />

            <div class="md-bottom-sheet__head-content">
              <slot name="head" />
            </div>
          </div>

          <div class="md-bottom-sheet__body">
            <slot />
          </div>
        </div>
      </div>
    </FixedPlaceholder>
  </div>
</template>

<style lang="css" scoped>
.md-bottom-sheet {
  height: var(--md-bottom-sheet-head-height);
  flex-shrink: 0;
  position: sticky;
  bottom: 0;
  pointer-events: none;
  background-color: transparent;

  &__scrim {
    height: var(--md-bottom-sheet-placeholder-bottom);
    width: calc((var(--md-bottom-sheet-placeholder-width) + 200px));
    position: fixed;
    top: 0;
    overflow-y: auto;
    padding: var(--md-bottom-sheet-placeholder-top) 100px 0;
    margin: 0 -100px;
    scrollbar-width: none;
    pointer-events: none;
    background-color: transparent;
    box-sizing: border-box;
    overscroll-behavior-y: none;
  }

  &__container {
    pointer-events: all;
    --md-container-color: var(--md-sys-color-surface-container-low);
    box-shadow: var(--md-sys-elevation-level1);
    border-radius: var(--md-sys-shape-corner-extra-large-top);
    overflow: hidden;
    max-width: 640px;
    margin: 0 auto;
    position: relative;
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

  &__head-content {
    .md-bottom-sheet__drag-handle + & {
      margin-top: 12px;
    }
  }
}
</style>
