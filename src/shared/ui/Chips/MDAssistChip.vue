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

const onClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<template>
  <MDChipBase
    type="assist"
    :label="label"
    :elevated="elevated"
    :draggable="draggable"
    :autofocus="autofocus"
    :disabled="disabled"
    @click="onClick"
  >
    <template v-if="$slots.leadingIcon" #leadingIcon>
      <slot name="leadingIcon" />
    </template>
  </MDChipBase>
</template>
