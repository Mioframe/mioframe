<script setup lang="ts">
import type { MaybeElement } from '@vueuse/core';
import { useElementSize, useWindowSize } from '@vueuse/core';
import type { CSSProperties } from 'vue';
import { computed, onBeforeUnmount, ref, watchEffect } from 'vue';

const props = defineProps<{
  originPosition?: { clientX: number; clientY: number };
  // eslint-disable-next-line vue/no-unused-properties -- only emit
  refEl?: MaybeElement;
}>();

const emit = defineEmits<{
  'update:refEl': [refEl: MaybeElement];
}>();
const rootEl = ref<HTMLElement>();

watchEffect(() => {
  emit('update:refEl', rootEl.value);
});

const { width: rootElWidth, height: rootElHeight } = useElementSize(rootEl);

const { width: windowWidth, height: windowHeight } = useWindowSize();

const mainStyle = computed((): CSSProperties | undefined => {
  if (props.originPosition) {
    const { clientX, clientY } = props.originPosition;

    return {
      left: `${Math.min(clientX, windowWidth.value - rootElWidth.value)}px`,
      top: `${Math.min(clientY, windowHeight.value - rootElHeight.value)}px`,
    };
  }
  return undefined;
});

defineSlots<{
  default(): unknown;
}>();

onBeforeUnmount(() => {
  emit('update:refEl', undefined);
});
</script>

<template>
  <Teleport to="body">
    <div ref="rootEl" class="popover" :style="mainStyle" :class="$attrs.class">
      <slot />
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.popover {
  position: fixed;
  z-index: 1;
}
</style>
