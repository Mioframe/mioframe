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

const onClick = (event: MouseEvent) => {
  emit('click', event);
};
const onClickClose = (event: MouseEvent) => {
  emit('clickClose', event);
};
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
    @click="onClick"
    @click-close="onClickClose"
  />
</template>
