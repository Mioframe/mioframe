<script setup lang="ts">
import MDChipBase from './MDChipBase.vue';
import type { MDChipCommonProps } from './types';

defineProps<MDChipCommonProps>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

const onClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<template>
  <MDChipBase
    type="suggestion"
    :label="label"
    :elevated="elevated"
    :draggable="draggable"
    :autofocus="autofocus"
    :disabled="disabled"
    @click="onClick"
  />
</template>
