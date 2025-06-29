<script setup lang="ts">
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';
import type { MaybeElement } from '@vueuse/core';
import { useElementSize, useWindowSize } from '@vueuse/core';
import type { CSSProperties } from 'vue';
import { computed, onBeforeUnmount, useTemplateRef, watchEffect } from 'vue';

const props = defineProps<{
  originPosition?: { clientX: number; clientY: number };
  // eslint-disable-next-line vue/no-unused-properties -- only emit
  refEl?: MaybeElement;
}>();

const emit = defineEmits<{
  'update:refEl': [refEl: MaybeElement];
}>();

defineSlots<{
  default(): unknown;
}>();

const popoverEl = useTemplateRef('popoverEl');

watchEffect(() => {
  emit('update:refEl', popoverEl.value);
});

const { width: rootElWidth, height: rootElHeight } = useElementSize(popoverEl);

const { width: windowWidth, height: windowHeight } = useWindowSize();

const mainStyle = computed((): CSSProperties | undefined => {
  // TODO: добавить ограничение размера и расположения
  if (props.originPosition) {
    const { clientX, clientY } = props.originPosition;

    return {
      top: `${Math.min(clientY, windowHeight.value - rootElHeight.value)}px`,
      left: `${Math.min(clientX, windowWidth.value - rootElWidth.value)}px`,
    };
  }
  return undefined;
});

onBeforeUnmount(() => {
  emit('update:refEl', undefined);
});

const targetTeleport = useClosestParentFrame();
</script>

<template>
  <Teleport defer :to="targetTeleport">
    <div
      ref="popoverEl"
      class="md popover"
      :style="mainStyle"
      :class="$attrs.class"
    >
      <slot />
    </div>
  </Teleport>
</template>

<style scoped>
.popover {
  position: fixed;
  z-index: 1;
}
</style>
