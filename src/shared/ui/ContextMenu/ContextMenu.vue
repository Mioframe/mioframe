<script setup lang="ts">
import { useElementSize, useWindowSize } from '@vueuse/core';
import type { CSSProperties } from 'vue';
import { computed, ref } from 'vue';

const props = defineProps<{
  originPosition?: { clientX: number; clientY: number };
}>();

const dropdownEl = ref<HTMLElement>();

const { width: dropdownWidth, height: dropdownHeight } =
  useElementSize(dropdownEl);

const { width: windowWidth, height: windowHeight } = useWindowSize();

const mainStyle = computed((): CSSProperties | undefined => {
  if (props.originPosition) {
    const { clientX, clientY } = props.originPosition;

    return {
      left: `${Math.min(clientX, windowWidth.value - dropdownWidth.value)}px`,
      top: `${Math.min(clientY, windowHeight.value - dropdownHeight.value)}px`,
    };
  }
  return undefined;
});

defineSlots<{
  default(): unknown;
}>();
</script>

<template>
  <Teleport to="body">
    <div ref="dropdownEl" class="dropdown is-position-fixed" :style="mainStyle">
      <div class="dropdown-content">
        <slot />
      </div>
    </div>
  </Teleport>
</template>

<style lang="scss" scoped>
.dropdown {
  z-index: 10;
}
</style>
