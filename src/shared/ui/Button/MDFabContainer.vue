<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import FixedPlaceholder from '../Layers/FixedPlaceholder.vue';
import { useEventListener, useParentElement } from '@vueuse/core';
import { isUndefined, throttle } from 'es-toolkit';

const props = defineProps<{
  autoHide?: boolean;
}>();

const { autoHide } = toRefs(props);

defineSlots<{
  default(): unknown;
}>();

const parentEl = useParentElement();

let lastScrollTop: number | undefined = undefined;

const scrollDirection = ref<'top' | 'bottom'>();

useEventListener(
  parentEl,
  'scroll',
  throttle(
    () => {
      if (parentEl.value) {
        if (lastScrollTop && parentEl.value.scrollTop > lastScrollTop) {
          scrollDirection.value = 'bottom';
        } else if (lastScrollTop && parentEl.value.scrollTop < lastScrollTop) {
          scrollDirection.value = 'top';
        } else {
          scrollDirection.value = undefined;
        }
        lastScrollTop = parentEl.value.scrollTop;
      }
    },
    300,
    { edges: ['leading', 'trailing'] },
  ),
);

const show = computed(
  () =>
    !autoHide.value ||
    isUndefined(scrollDirection.value) ||
    scrollDirection.value === 'top',
);
</script>

<template>
  <FixedPlaceholder
    class="md-fab-container__placeholder"
    priority-width="placeholder"
    :class="{
      'md-fab-container_auto-hide': autoHide,
    }"
  >
    <Transition>
      <div
        v-if="show"
        class="md-fab-container"
        :class="{
          'md-fab-container_auto-hide': autoHide,
        }"
      >
        <slot name="default" />
      </div>
    </Transition>
  </FixedPlaceholder>
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

  &__placeholder {
    display: flex;
    position: sticky;
    bottom: 0;
    flex-shrink: 0;
    margin-right: calc(16px - var(--md-pane-padding, 0));
  }

  &_auto-hide {
    &.md-fab-container__placeholder {
      height: 0;
    }
    &.md-fab-container {
      position: absolute;
      bottom: 0;
      right: 0;
    }
  }

  &.v {
    &-enter-active,
    &-leave-active {
      transition-property: transform, opacity;
      transition-duration: var(--md-sys-motion-duration-medium1);
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
  /* } */
}
</style>
