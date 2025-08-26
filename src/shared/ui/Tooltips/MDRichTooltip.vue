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
import { computed, ref, toRefs, useTemplateRef } from 'vue';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue';

const props = withDefaults(
  defineProps<{
    subhead: string;
    disabledTeleport?: boolean;
    targetElement?: MaybeElement;
    show?: boolean | undefined;
    useClick?: boolean;
    useHover?: boolean;
    placement?: 'top-start' | 'top-end' | 'bottom-end' | 'bottom-start';
  }>(),
  {
    show: undefined,
    placement: 'top-end',
  },
);

const { subhead, targetElement, show, useClick, useHover, placement } =
  toRefs(props);

const slots = defineSlots<{
  text(): unknown;
  actions(): unknown;
}>();

const parentEl = useParentElement();

const targetElementRef = computed(() =>
  unrefElement(targetElement.value ?? parentEl.value),
);

const targetTeleport = useClosestParentFrame();

const hoveredTarget = useElementHover(targetElementRef);

const generalHovered = computed(
  () => useHover.value && (hoveredTarget.value || hoveredTooltip.value),
);

const tooltipEl = useTemplateRef('tooltipEl');

const hoveredTooltip = useElementHover(tooltipEl);

const debounceHovered = refDebounced(generalHovered, 1.5e3);

const computedShow = computed(
  () => show.value ?? (showOnClick.value || debounceHovered.value),
);

const { floatingStyles: richTooltipStyle, update } = useFloating(
  targetElementRef,
  tooltipEl,
  {
    strategy: 'fixed',
    placement,
    middleware: [
      offset(({ rects }) => ({
        alignmentAxis: -rects.floating.width - 8,
        mainAxis: 8,
      })),
      flip({
        padding: 16,
      }),
      shift({
        padding: 16,
      }),
    ],
    whileElementsMounted: autoUpdate,
  },
);

useEventListener(window.visualViewport, 'resize', update);

const showOnClick = ref(false);

useEventListener(targetElementRef, 'click', () => {
  if (useClick.value) {
    showOnClick.value = true;
  }
});

onInteractionOutside(tooltipEl, () => {
  showOnClick.value = false;
});
</script>

<template>
  <Teleport :to="targetTeleport" :disabled="disabledTeleport">
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
