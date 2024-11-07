<script setup lang="ts">
import {
  useElementSize,
  useScroll,
  useVModel,
  watchDebounced,
} from '@vueuse/core';
import type { EmptyObject } from 'type-fest';
import { ref, watch } from 'vue';

defineSlots<{
  default(p: EmptyObject): unknown;
}>();

const props = defineProps<{
  // eslint-disable-next-line vue/no-unused-properties -- use in useVModel
  open?: boolean;
  right?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const modelOpen = useVModel(props, 'open', emit);

const refTray = ref<HTMLElement>();

const refContent = ref<HTMLElement>();

const { height: contentHeight } = useElementSize(refContent);

const { y: trayScrollY, x: trayScrollX } = useScroll(refTray, {
  behavior: 'smooth',
});

watch(
  [modelOpen, refTray],
  ([modelOpen]) => {
    if (!modelOpen) {
      if (props.right) {
        trayScrollX.value = 0;
      } else {
        trayScrollY.value = 0;
      }
    } else {
      if (trayScrollY.value === 0 || trayScrollX.value === 0) {
        if (props.right) {
          trayScrollX.value = refContent.value?.scrollWidth ?? 0;
        } else {
          trayScrollY.value = contentHeight.value;
        }
      }
    }
  },
  { immediate: true },
);

watchDebounced(
  [trayScrollY, refTray],
  ([trayScrollY]) => {
    if (modelOpen.value !== !!trayScrollY) {
      modelOpen.value = !!trayScrollY;
    }
  },
  { debounce: 300 },
);
</script>

<template>
  <div
    class="sliding-panel"
    :class="{
      _right: right,
    }"
  >
    <div ref="refTray" class="sliding-panel__tray">
      <div ref="refContent" class="sliding-panel__content">
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.sliding-panel {
  --sliding-panel-min-height: 100px;
  --sliding-panel-min-width: 100px;
  --sliding-panel-background: transparent;
  height: var(--sliding-panel-min-height);
  min-height: var(--sliding-panel-min-height);

  &._right {
    height: initial;
    min-height: initial;
    width: var(--sliding-panel-min-width);
    min-width: var(--sliding-panel-min-width);
  }

  &__tray {
    position: fixed;
    z-index: 1;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    pointer-events: none;
    overflow-y: auto;
    padding-top: calc(100dvh - var(--sliding-panel-min-height));
    scrollbar-width: none;
    height: 100dvh;
    box-sizing: border-box;

    .sliding-panel._right & {
      overflow-y: initial;
      overflow-x: auto;
      padding-top: 0;
      padding-left: calc(100vw - var(--sliding-panel-min-width));
      width: 100vw;
      display: flex;
      align-items: center;
    }
  }

  &__content {
    background: var(--sliding-panel-background);
    pointer-events: all;
    min-height: var(--sliding-panel-min-height);

    .sliding-panel._right & {
      min-height: initial;
      width: min-content;
      min-width: var(--sliding-panel-min-width);
    }
  }
}
</style>
