<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed } from 'vue';

const props = defineProps<{
  originPosition?: { x: number; y: number };
}>();

const mainStyle = computed((): CSSProperties | undefined => {
  if (props.originPosition) {
    return {
      left: `${props.originPosition.x}px`,
      right: `${props.originPosition.y}px`,
    };
  }
  return undefined;
});

defineSlots<{
  default(): unknown;
}>();
</script>

<template>
  <div class="dropdown is-position-fixed" :style="mainStyle">
    <div class="dropdown-content">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.dropdown {
  z-index: 10;
}
</style>
