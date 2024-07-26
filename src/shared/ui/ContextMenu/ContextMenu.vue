<script setup lang="ts">
import type { CSSProperties } from 'vue';
import { computed } from 'vue';

const props = defineProps<{
  originPosition?: { clientX: number; clientY: number };
}>();

const mainStyle = computed((): CSSProperties | undefined => {
  if (props.originPosition) {
    return {
      left: `${props.originPosition.clientX}px`,
      top: `${props.originPosition.clientY}px`,
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
    <div class="dropdown is-position-fixed" :style="mainStyle">
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
