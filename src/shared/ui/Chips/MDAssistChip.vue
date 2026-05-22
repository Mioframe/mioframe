<script setup lang="ts">
import MDChipBase from './MDChipBase.vue';
import type { MDChipCommonProps } from './types';

defineProps<MDChipCommonProps>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

defineSlots<{
  leadingIcon?: () => unknown;
}>();
</script>

<template>
  <MDChipBase
    type="assist"
    :label="label"
    :elevated="elevated"
    :draggable="draggable"
    :autofocus="autofocus"
    :disabled="disabled"
    @click="(event) => emit('click', event)"
  >
    <template v-if="$slots.leadingIcon" #leadingIcon>
      <slot name="leadingIcon" />
    </template>
  </MDChipBase>
</template>
