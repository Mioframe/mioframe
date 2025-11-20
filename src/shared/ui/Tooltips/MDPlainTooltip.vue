<script setup lang="ts">
import { computed, ref, toRefs, useTemplateRef } from 'vue';
import type { MaybeElement } from '@vueuse/core';
import {
  refDebounced,
  unrefElement,
  useEventListener,
  useParentElement,
} from '@vueuse/core';
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/vue';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import { useOverlayContainer } from '../Overlay';

const props = withDefaults(
  defineProps<{
    text: string;
    target?: MaybeElement;
    disabledTeleport?: boolean;
    placement?: 'bottom' | 'left' | 'right' | 'top';
  }>(),
  {
    placement: 'top',
  },
);

const { target, placement } = toRefs(props);

const parentEl = useParentElement();

const targetElementRef = computed(
  () => unrefElement(target.value) ?? parentEl.value,
);

const targetTeleport = useOverlayContainer();

const tooltipEl = useTemplateRef('tooltipEl');

const { floatingStyles: tooltipStyle, update } = useFloating(
  targetElementRef,
  tooltipEl,

  {
    strategy: 'fixed',
    placement,
    middleware: [
      offset(8),
      flip({
        padding: 16,
        fallbackAxisSideDirection: 'end',
      }),
      shift({
        padding: 16,
      }),
    ],
    whileElementsMounted: autoUpdate,
  },
);

useEventListener(window.visualViewport, 'resize', update);

const hovered = ref(false);

useEventListener(targetElementRef, 'pointerenter', () => {
  hovered.value = true;
});

useEventListener(targetElementRef, 'pointerleave', () => {
  hovered.value = false;
});

const show = refDebounced(hovered, 1.5e3);
</script>

<template>
  <TeleportContainer
    :to="targetTeleport"
    :disabled="disabledTeleport"
    :container="tooltipEl"
  >
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
  </TeleportContainer>
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
