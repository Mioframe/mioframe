<script setup lang="ts">
import { computed, ref, toRefs, useTemplateRef, watchEffect } from 'vue';
import { useParentElement, useScroll } from '@vueuse/core';
import { isUndefined } from 'es-toolkit';
import { TeleportWithPlaceholder } from '@shared/lib/teleport';
import { usePaneContainer } from '../Layout/useMDContainer';

const props = defineProps<{
  autoHide?: boolean;
}>();

const { autoHide } = toRefs(props);

defineSlots<{
  default(): unknown;
}>();

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

const show = computed(
  () =>
    !autoHide.value ||
    isUndefined(lastScrollDirection.value) ||
    lastScrollDirection.value === 'top',
);

const fabContainer = useTemplateRef('fabContainer');

const paneContainer = usePaneContainer();

const to = computed(() => paneContainer.value ?? document.body);
</script>

<template>
  <TeleportWithPlaceholder
    class="md-fab-container__placeholder"
    priority-width="placeholder"
    :container="fabContainer"
    with-placeholder
    :class="{
      'md-fab-container_auto-hide': autoHide,
    }"
    :to="to"
  >
    <div
      ref="fabContainer"
      class="md-fab-container"
      :class="{
        'md-fab-container_auto-hide': autoHide,
        'md-fab-container_hide': !show,
      }"
    >
      <slot name="default" />
    </div>
  </TeleportWithPlaceholder>
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
  padding-right: calc(
    16px - var(--md-pane-margin-x) - var(--md-pane-padding-x)
  );
  transition-timing-function: var(
    var(--md-sys-motion-easing-emphasized-decelerate)
  );
  transition-duration: var(--md-sys-motion-duration-long2);

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
    transition-timing-function: var(
      var(--md-sys-motion-easing-emphasized-accelerate)
    );
    transition-duration: var(--md-sys-motion-duration-short4);
    opacity: 0;
    transform: translateY(100%) scale(0);
  }

  /* &.v {
    &-enter,
    &-leave {
      &-active {
        transition-property: transform, opacity;
      }
    }

    &-leave-active {
      transition-timing-function: var(
        var(--md-sys-motion-easing-emphasized-accelerate)
      );
      transition-duration: var(--md-sys-motion-duration-short4);
    }

    &-enter-active {
      transition-timing-function: var(
        var(--md-sys-motion-easing-emphasized-decelerate)
      );
      transition-duration: var(--md-sys-motion-duration-long2);
    }

    &-leave-to,
    &-enter-from {
      opacity: 0;
      transform: translateY(100%) scale(0);
    }

    &-leave-from,
    &-enter-to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  } */

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
