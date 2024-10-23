<script setup lang="ts">
import { useElementSize, useScroll, useVModel } from '@vueuse/core';
import type { EmptyObject } from 'type-fest';
import { ref, watch } from 'vue';

defineSlots<{
  default(p: EmptyObject): unknown;
}>();

const props = defineProps<{
  // eslint-disable-next-line vue/no-unused-properties -- use in useVModel
  open?: boolean;
}>();

const emit = defineEmits<{
  'update:open': [open: boolean];
}>();

const modelOpen = useVModel(props, 'open', emit);

const refTray = ref<HTMLElement>();

const refContent = ref<HTMLElement>();

const { height: contentHeight } = useElementSize(refContent);

const { y: trayScrollY } = useScroll(refTray, { behavior: 'smooth' });

watch(
  [modelOpen, refTray],
  ([modelOpen]) => {
    if (!modelOpen) {
      trayScrollY.value = 0;
    } else {
      if (trayScrollY.value === 0) {
        trayScrollY.value = contentHeight.value;
      }
    }
  },
  { immediate: true },
);

watch([trayScrollY, refTray], ([trayScrollY]) => {
  if (modelOpen.value !== !!trayScrollY) {
    modelOpen.value = !!trayScrollY;
  }
});
</script>

<template>
  <div class="sliding-panel">
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
  --sliding-panel-background: transparent;
  height: var(--sliding-panel-min-height);
  min-height: var(--sliding-panel-min-height);

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
  }

  &__content {
    background: var(--sliding-panel-background);
    pointer-events: all;
    min-height: var(--sliding-panel-min-height);
  }
}
</style>
