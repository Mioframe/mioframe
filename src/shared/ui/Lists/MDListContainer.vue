<script setup lang="ts">
import MDList from './MDList.vue';
import type { MDListModelValue, MDListSelectionMode, MDListStyle } from './listContext';

withDefaults(
  defineProps<{
    is?: 'div' | 'ul' | undefined;
    listStyle?: MDListStyle | undefined;
    modelValue?: MDListModelValue;
    selectionMode?: MDListSelectionMode | undefined;
    tag?: 'div' | 'ul' | undefined;
    transition?: boolean | undefined;
  }>(),
  {
    listStyle: 'standard',
    selectionMode: 'none',
    tag: 'div',
    transition: false,
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: MDListModelValue];
}>();

defineSlots<{
  default: () => unknown;
}>();

const onUpdateModelValue = (value: MDListModelValue) => {
  emit('update:modelValue', value);
};
</script>

<template>
  <MDList
    :is="is"
    :list-style="listStyle"
    :model-value="modelValue"
    :selection-mode="selectionMode"
    :tag="tag"
    :transition="transition"
    v-bind="$attrs"
    @update:model-value="onUpdateModelValue"
  >
    <slot />
  </MDList>
</template>
