<script setup lang="ts">
import type { MaybeElement } from '@vueuse/core';
import { onBeforeUnmount, ref, watchEffect } from 'vue';
import PopOver from '../PopOver/PopOver.vue';

defineProps<{
  originPosition?: { clientX: number; clientY: number };
  // eslint-disable-next-line vue/no-unused-properties -- only emit
  refDropdown: MaybeElement;
}>();

const emit = defineEmits<{
  'update:refDropdown': [refDropdown: MaybeElement];
}>();
const dropdownEl = ref<HTMLElement>();

watchEffect(() => {
  emit('update:refDropdown', dropdownEl.value);
});

defineSlots<{
  default(): unknown;
}>();

onBeforeUnmount(() => {
  emit('update:refDropdown', undefined);
});
</script>

<template>
  <PopOver v-model:ref-el="dropdownEl" :origin-position class="dropdown">
    <div class="dropdown-content">
      <slot />
    </div>
  </PopOver>
</template>

<style lang="scss" scoped>
.dropdown {
  z-index: 10;
}
</style>
