<script setup lang="ts">
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';
import type { MaybeElement } from '@vueuse/core';
import { useCssVar, useElementBounding, useElementSize } from '@vueuse/core';
import type { RendererElement } from 'vue';
import { computed, useTemplateRef, watchEffect } from 'vue';
import { TeleportContainer } from '../teleportContainer';

const {
  priorityWidth = 'content',
  priorityHeight = 'content',
  to,
  container,
} = defineProps<{
  priorityWidth?: 'placeholder' | 'content';
  priorityHeight?: 'placeholder' | 'content';
  withPlaceholder?: boolean;
  to?: string | RendererElement | null | undefined;
  container: MaybeElement;
}>();

defineSlots<{
  default(p: {
    targetWidth: number;
    targetHeight: number;
    placeholderWidth: number;
  }): unknown;
}>();

const emptySlotDetector = useTemplateRef('emptySlotDetector');
const placeholderEl = useTemplateRef('placeholderEl');

const enableCalculatePosition = computed(() => !emptySlotDetector.value);

const {
  top: placeholderTop,
  left: placeholderLeft,
  width: placeholderWidth,
  height: placeholderHeight,
} = useElementBounding(
  computed(() =>
    enableCalculatePosition.value ? placeholderEl.value : undefined,
  ),
);

const contentEl = useTemplateRef('contentEl');

const { width: contentWidth, height: contentHeight } = useElementSize(
  computed(() => (enableCalculatePosition.value ? contentEl.value : undefined)),
);

const placeholderTopCssVar = useCssVar('--teleport-placeholder-top', contentEl);
watchEffect(() => {
  placeholderTopCssVar.value = `${placeholderTop.value}px`;
});

const placeholderWidthCssVar = useCssVar(
  '--teleport-placeholder-width',
  contentEl,
);

watchEffect(() => {
  placeholderWidthCssVar.value =
    priorityWidth === 'placeholder' ? `${placeholderWidth.value}px` : undefined;
});

const placeholderHeightCssVar = useCssVar(
  '--teleport-placeholder-height',
  contentEl,
);
watchEffect(() => {
  placeholderHeightCssVar.value =
    priorityHeight === 'placeholder'
      ? `${placeholderHeight.value}px`
      : undefined;
});

const placeholderLeftCssVar = useCssVar(
  '--teleport-placeholder-left',
  contentEl,
);
watchEffect(() => {
  placeholderLeftCssVar.value = `${placeholderLeft.value}px`;
});

const contentWidthCssVar = useCssVar('--teleport-content-width', placeholderEl);
watchEffect(() => {
  contentWidthCssVar.value =
    priorityWidth === 'content' ? `${contentWidth.value}px` : undefined;
});

const contentHeightCssVar = useCssVar(
  '--teleport-content-height',
  placeholderEl,
);

watchEffect(() => {
  contentHeightCssVar.value =
    priorityHeight === 'content' ? `${contentHeight.value}px` : undefined;
});

const closestParentFrame = useClosestParentFrame();

const teleportTo = computed(() => to ?? closestParentFrame.value);

const { height: targetHeight, width: targetWidth } = useElementSize(
  computed(() =>
    enableCalculatePosition.value &&
    closestParentFrame.value instanceof HTMLElement
      ? closestParentFrame.value
      : undefined,
  ),
  undefined,
  { box: 'border-box' },
);
</script>

<template>
  <div v-if="withPlaceholder" ref="placeholderEl" class="teleport-placeholder">
    <TeleportContainer :to="teleportTo" :container="container">
      <div ref="contentEl" class="teleport-placeholder__content">
        <slot
          :target-height="targetHeight"
          :target-width="targetWidth"
          :placeholder-width="placeholderWidth"
        >
          <i ref="emptySlotDetector" class="empty-slot-detector" />
        </slot>
      </div>
    </TeleportContainer>
  </div>

  <TeleportContainer v-else :to="teleportTo" :container="container">
    <slot
      :class="$attrs.class"
      :target-height="targetHeight"
      :target-width="targetWidth"
      :placeholder-width="placeholderWidth"
    >
      <i ref="emptySlotDetector" class="empty-slot-detector" />
    </slot>
  </TeleportContainer>
</template>

<style lang="css" scoped>
.teleport-placeholder {
  --teleport-content-width: unset;
  --teleport-content-height: unset;
  --teleport-placeholder-height: unset;

  display: inline-block;
  background: transparent;
  pointer-events: none;
  position: relative;
  width: var(--teleport-content-width);
  height: var(--teleport-content-height);
  flex-shrink: 0;

  &__content {
    --teleport-placeholder-top: unset;
    --teleport-placeholder-left: unset;
    --teleport-placeholder-width: unset;
    --teleport-placeholder-height: unset;

    position: fixed;
    top: var(--teleport-placeholder-top);
    left: var(--teleport-placeholder-left);
    width: var(--teleport-placeholder-width);
    height: var(--teleport-placeholder-height);
    background: transparent;
    pointer-events: none;
    z-index: 1;
    transition-property: none;

    :deep(> *) {
      pointer-events: all;
    }
  }
}

.empty-slot-detector {
  pointer-events: none;
  position: absolute;
  opacity: 0;
}
</style>
