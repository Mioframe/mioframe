<script setup lang="ts">
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';
import { setupTooltip } from './setupTooltip';
import { computed, useTemplateRef } from 'vue';
import { refDebounced, useElementHover, useParentElement } from '@vueuse/core';

const { targetElement } = defineProps<{
  text: string;
  targetElement?: HTMLElement | SVGElement | null;
  disabledTeleport?: boolean;
}>();

const parentEl = useParentElement();

const targetElementRef = computed(() => targetElement ?? parentEl.value);

const targetTeleport = useClosestParentFrame();

const tooltipEl = useTemplateRef('tooltipEl');

const { plainTooltipStyle: tooltipStyle } = setupTooltip(
  targetElementRef,
  tooltipEl,
);

const hovered = useElementHover(targetElementRef);

const show = refDebounced(hovered, 1.5e3);
</script>

<template>
  <Teleport :to="targetTeleport"  :disabled="disabledTeleport">
    <Transition>
      <div
        v-if="show"
        ref="tooltipEl"
        class="md-plain-tooltip"
        :style="tooltipStyle"
      >
        {{ text }}
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.md-plain-tooltip {
  display: flex;
  justify-content: center;
  align-items: center;

  color: var(--md-sys-color-inverse-on-surface);
  background-color: var(--md-sys-color-inverse-surface);
  min-height: 24px;
  padding-left: 8px;
  padding-right: 8px;
  border-radius: var(--md-sys-shape-corner-extra-small);

  font-family: var(--md-sys-typescale-body-small-font);
  line-height: var(--md-sys-typescale-body-small-line-height);
  font-size: var(--md-sys-typescale-body-small-size);
  font-weight: var(--md-sys-typescale-body-small-weight);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);

  position: fixed;
  z-index: 1;

  transition-property: transform, opacity;
  transition-duration: var(--md-sys-motion-duration-medium1);

  &.v-leave-to,
  &.v-enter-from {
    transform: scaleY(0);
  }

  &.v-leave-from,
  &.v-enter-to {
    transform: scaleY(1);
  }
}
</style>
