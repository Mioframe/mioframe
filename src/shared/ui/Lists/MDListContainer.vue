<script setup lang="ts">
import MDList from './MDList.vue';
import type { MDListDensity, MDListStyle } from './listContext';

withDefaults(
  defineProps<{
    density?: MDListDensity | undefined;
    is?: 'div' | 'ul' | undefined;
    tag?: 'div' | 'ul' | undefined;
    listStyle?: MDListStyle | undefined;
    transition?: boolean | undefined;
  }>(),
  {
    density: 'baseline',
    tag: 'div',
    listStyle: 'standard',
    transition: false,
  },
);

defineSlots<{
  default: () => unknown;
}>();
</script>

<template>
  <MDList
    :is="is"
    :density="density"
    :tag="tag"
    :list-style="listStyle"
    :transition="transition"
    v-bind="$attrs"
  >
    <slot />
  </MDList>
</template>
