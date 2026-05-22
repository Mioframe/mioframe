<script setup lang="ts">
import MDChipBase from './MDChipBase.vue';
import type { MDChipCommonProps } from './types';

defineProps<
  MDChipCommonProps & {
    closeTooltip?: string | undefined;
  }
>();

const emit = defineEmits<{
  click: [event: MouseEvent];
  clickClose: [event: MouseEvent];
}>();
</script>

<template>
  <MDChipBase
    type="input"
    :label="label"
    :elevated="elevated"
    :draggable="draggable"
    :autofocus="autofocus"
    :disabled="disabled"
    :close-tooltip="closeTooltip"
    @click="(event) => emit('click', event)"
    @click-close="(event) => emit('clickClose', event)"
  />
</template>
