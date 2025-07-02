<script setup lang="ts">
import { MD_SYS_TYPESCALE } from '@shared/lib/md';
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';
import {
  refDebounced,
  unrefElement,
  useElementHover,
  useEventListener,
  useParentElement,
  type MaybeElement,
} from '@vueuse/core';
import { computed, ref, useTemplateRef } from 'vue';
import { setupTooltip } from './setupTooltip';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';

const {
  subhead,
  targetElement,
  show = undefined,
  useClick,
  useHover,
} = defineProps<{
  subhead: string;
  disabledTeleport?: boolean;
  targetElement?: MaybeElement;
  show?: boolean | undefined;
  useClick?: boolean;
  useHover?: boolean;
}>();

const slots = defineSlots<{
  text(): unknown;
  actions(): unknown;
}>();

const parentEl = useParentElement();

const targetElementRef = computed(() =>
  unrefElement(targetElement ?? parentEl.value),
);

const targetTeleport = useClosestParentFrame();

const hoveredTarget = useElementHover(targetElementRef);

const generalHovered = computed(
  () => useHover && (hoveredTarget.value || hoveredTooltip.value),
);

const tooltipEl = useTemplateRef('tooltipEl');

const hoveredTooltip = useElementHover(tooltipEl);

const debounceHovered = refDebounced(generalHovered, 1.5e3);

const computedShow = computed(
  () => show ?? (showOnClick.value || debounceHovered.value),
);

const { richTooltipStyle } = setupTooltip(targetElementRef, tooltipEl);

const showOnClick = ref(false);

useEventListener(targetElementRef, 'click', () => {
  if (useClick) {
    showOnClick.value = true;
  }
});

onInteractionOutside(tooltipEl, () => {
  showOnClick.value = false;
});
</script>

<template>
  <Teleport :to="targetTeleport" defer :disabled="disabledTeleport">
    <Transition>
      <div
        v-if="computedShow"
        ref="tooltipEl"
        class="md md-rich-tooltip"
        :style="richTooltipStyle"
      >
        <div
          class="md-rich-tooltip__subhead"
          :class="MD_SYS_TYPESCALE.title.small"
        >
          {{ subhead }}
        </div>

        <div
          class="md-rich-tooltip__supporting-text"
          :class="MD_SYS_TYPESCALE.body.medium"
        >
          <slot name="text" />
        </div>

        <div v-if="!!slots.actions" class="md-rich-tooltip__actions">
          <slot name="actions" />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="css" scoped>
.md-rich-tooltip {
  --md-container-color: var(--md-sys-color-surface-container);
  box-shadow: var(--md-sys-elevation-level2);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 12px 16px 8px;
  box-sizing: border-box;
  max-width: min(calc(100vw - 16px * 2), 640px);

  position: fixed;
  z-index: 1;
  left: 16px;
  top: 16px;

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

  &__subhead {
    --md-content-color: var(--md-sys-color-on-surface-variant);
  }

  &__supporting-text {
    --md-content-color: var(--md-sys-color-on-surface-variant);
    margin-top: 4px;
  }

  &__actions {
    margin-top: 12px;
    display: flex;
    gap: 2step;
  }
}
</style>
