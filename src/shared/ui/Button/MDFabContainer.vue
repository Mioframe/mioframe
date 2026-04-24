<script setup lang="ts">
import type { StyleValue } from 'vue';
import { computed, ref, toRefs, useTemplateRef, watchEffect } from 'vue';
import { useElementSize, useFocusWithin, useParentElement, useScroll } from '@vueuse/core';
import { isUndefined } from 'es-toolkit';
import { useOverlayContainer } from '../Overlay';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import { autoUpdate, offset, shift, useFloating } from '@floating-ui/vue';
import { useMainContentAriaHidden } from '../AriaHidden';

const props = defineProps<{
  autoHide?: boolean;
}>();

defineSlots<{
  default(): unknown;
}>();

const { autoHide } = toRefs(props);

const fabContainerEl = useTemplateRef('fabContainer');

const placeholderEl = useTemplateRef('placeholderEl');

const parentEl = useParentElement();

const lastScrollDirection = ref<'top' | 'bottom'>();

const { directions } = useScroll(parentEl);

watchEffect(() => {
  if (directions.top) {
    lastScrollDirection.value = 'top';
  } else if (directions.bottom) {
    lastScrollDirection.value = 'bottom';
  }
});

const { focused: focusedWithin } = useFocusWithin(fabContainerEl);

const show = computed(
  () =>
    !autoHide.value ||
    isUndefined(lastScrollDirection.value) ||
    lastScrollDirection.value === 'top' ||
    focusedWithin.value,
);

const overlayContainerEl = useOverlayContainer();

const { floatingStyles } = useFloating(placeholderEl, fabContainerEl, {
  placement: 'top-end',
  strategy: 'fixed',
  transform: false,
  middleware: [
    offset(
      ({
        rects: {
          reference: { height },
        },
      }) => ({
        mainAxis: -height,
      }),
    ),
    shift({ padding: 16 }),
  ],
  whileElementsMounted: autoUpdate,
});

const { height: fabContainerHeight } = useElementSize(
  fabContainerEl,
  { height: 0, width: 0 },
  { box: 'border-box' },
);

const placeholderStyles = computed(
  (): StyleValue => ({
    height: `${fabContainerHeight.value}px`,
  }),
);

const ariaHidden = useMainContentAriaHidden();
</script>

<template>
  <div ref="placeholderEl" class="md-fab-container__placeholder" :style="placeholderStyles">
    <TeleportContainer :container="fabContainerEl" :to="overlayContainerEl">
      <div
        ref="fabContainer"
        class="md-fab-container"
        :class="{
          'md-fab-container_auto-hide': autoHide,
          'md-fab-container_hide': !show,
        }"
        :style="floatingStyles"
        :aria-hidden="ariaHidden"
      >
        <slot name="default" />
      </div>
    </TeleportContainer>
  </div>
</template>

<style scoped>
.md-fab-container {
  display: flex;
  flex-direction: column;
  pointer-events: none;
  background-color: transparent;
  align-items: center;
  align-self: flex-end;
  justify-self: flex-end;
  margin-top: auto;
  margin-left: auto;
  padding-bottom: 16px;
  width: min-content;
  padding-right: calc(16px - var(--md-pane-margin-x) - var(--md-pane-padding-x));
  transition-timing-function: var(var(--md-sys-motion-easing-emphasized-decelerate));
  transition-duration: var(--md-sys-motion-duration-long2);
  transition-property: transform, opacity;

  &__placeholder {
    display: flex;
    position: sticky;
    right: 0;
    bottom: 0;
    left: 0;
    flex-shrink: 0;
    width: 100%;
  }

  &_hide {
    pointer-events: none;
    transition-timing-function: var(var(--md-sys-motion-easing-emphasized-accelerate));
    transition-duration: var(--md-sys-motion-duration-short4);
    opacity: 0;
    transform: translateY(100%) scale(0);
  }

  :deep() {
    > * {
      pointer-events: auto;
    }

    > .md-fab {
      margin-top: 16px;

      &:not(.md-fab_small) {
        margin-top: 24px;
      }
    }
  }
}
</style>
