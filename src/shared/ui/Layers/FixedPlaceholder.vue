<script setup lang="ts">
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';
import { useCssVar, useElementBounding, useElementSize } from '@vueuse/core';
import { ref, watchEffect } from 'vue';

const { priorityWidth = 'content', priorityHeight = 'content' } = defineProps<{
  priorityWidth?: 'placeholder' | 'content';
  priorityHeight?: 'placeholder' | 'content';
}>();

defineSlots<{
  default(): unknown;
}>();

const placeholder = ref<HTMLDivElement>();
const {
  top: placeholderTop,
  left: placeholderLeft,
  width: placeholderWidth,
  height: placeholderHeight,
} = useElementBounding(placeholder, {
  updateTiming: 'next-frame',
});

const content = ref<HTMLDivElement>();
const { width: contentWidth, height: contentHeight } = useElementSize(content);

const placeholderTopCssVar = useCssVar('--placeholder-top', content);
watchEffect(() => {
  placeholderTopCssVar.value = `${placeholderTop.value}px`;
});

const placeholderWidthCssVar = useCssVar('--placeholder-width', content);
watchEffect(() => {
  placeholderWidthCssVar.value =
    priorityWidth === 'placeholder' ? `${placeholderWidth.value}px` : undefined;
});

const placeholderHeightCssVar = useCssVar('--placeholder-height', content);
watchEffect(() => {
  placeholderHeightCssVar.value =
    priorityHeight === 'placeholder'
      ? `${placeholderHeight.value}px`
      : undefined;
});

const placeholderLeftCssVar = useCssVar('--placeholder-left', content);
watchEffect(() => {
  placeholderLeftCssVar.value = `${placeholderLeft.value}px`;
});

const contentWidthCssVar = useCssVar('--content-width', placeholder);
watchEffect(() => {
  contentWidthCssVar.value =
    priorityWidth === 'content' ? `${contentWidth.value}px` : undefined;
});

const contentHeightCssVar = useCssVar('--content-height', placeholder);
watchEffect(() => {
  contentHeightCssVar.value =
    priorityHeight === 'content' ? `${contentHeight.value}px` : undefined;
});

const targetTeleport = useClosestParentFrame();
</script>

<template>
  <div ref="placeholder" class="fixed-placeholder">
    <Teleport defer :to="targetTeleport">
      <div ref="content" class="fixed-placeholder__content">
        <slot />
      </div>
    </Teleport>
  </div>
</template>

<style lang="css" scoped>
.fixed-placeholder {
  display: inline-block;
  background: transparent;
  pointer-events: none;
  position: relative;
  width: var(--content-width);
  height: var(--content-height);

  &__content {
    position: fixed;
    top: var(--placeholder-top);
    left: var(--placeholder-left);
    width: var(--placeholder-width);
    height: var(--placeholder-height);
    background: transparent;
    pointer-events: none;
    z-index: 1;

    :deep(> *) {
      pointer-events: all;
    }
  }
}
</style>
