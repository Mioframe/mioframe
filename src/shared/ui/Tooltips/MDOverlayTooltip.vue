<script setup lang="ts">
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';
import {
  syncRef,
  unrefElement,
  useEventListener,
  useParentElement,
  type MaybeElement,
} from '@vueuse/core';
import { computed, ref, toRefs, useTemplateRef } from 'vue';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { autoUpdate, offset, shift, useFloating } from '@floating-ui/vue';
import { TeleportContainer } from '@shared/lib/teleportContainer';

const props = defineProps<{
  disabledTeleport?: boolean;
  targetElement?: MaybeElement;
}>();

const { disabledTeleport, targetElement } = toRefs(props);

const showModel = defineModel<boolean>('show', { default: false });

const emit = defineEmits<{
  interactionOutside: [];
}>();

defineSlots<{
  default(): unknown;
}>();

const showState = ref<boolean>(false);

syncRef(showModel, showState);

const parentEl = useParentElement();

const targetElementRef = computed(() =>
  unrefElement(targetElement.value ?? parentEl.value),
);

const targetTeleport = useClosestParentFrame();

const tooltipEl = useTemplateRef('tooltipEl');

const { floatingStyles: alignCenterStyle, update } = useFloating(
  targetElementRef,
  tooltipEl,
  {
    strategy: 'fixed',
    transform: false,
    middleware: [
      offset(
        ({ rects }) => -rects.reference.height / 2 - rects.floating.height / 2,
      ),
      shift({ padding: 16, crossAxis: true }),
    ],
    whileElementsMounted: autoUpdate,
  },
);

useEventListener(window.visualViewport, 'resize', update);

onInteractionOutside(tooltipEl, () => {
  emit('interactionOutside');
});
</script>

<template>
  <TeleportContainer
    :to="targetTeleport"
    :disabled="disabledTeleport"
    :container="tooltipEl"
  >
    <Transition>
      <div
        v-if="showState"
        ref="tooltipEl"
        class="md md-overlay-tooltip"
        :style="alignCenterStyle"
      >
        <slot name="default" />
      </div>
    </Transition>
  </TeleportContainer>
</template>

<style lang="css" scoped>
.md-overlay-tooltip {
  --md-container-color: var(--md-sys-color-surface-container);
  --md-content-color: var(--md-sys-color-on-surface-variant);

  box-shadow: var(--md-sys-elevation-level2);
  border-radius: var(--md-sys-shape-corner-medium);
  padding: 12px 16px 8px;
  box-sizing: border-box;

  position: fixed;
  z-index: 1;
  left: 16px;
  top: 16px;
  max-width: calc(100dvw - 32px);
  max-height: calc(100dvh - 32px);
  overflow: auto;
  display: flex;
  flex-direction: column;

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
