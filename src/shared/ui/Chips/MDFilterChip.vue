<script setup lang="ts">
import MDChipBase from './MDChipBase.vue';
import type { MDChipCommonProps } from './types';

defineProps<
  MDChipCommonProps & {
    selected?: boolean | undefined;
  }
>();

const emit = defineEmits<{
  click: [event: MouseEvent];
}>();

defineSlots<{
  trailingIcon?: () => unknown;
}>();

const onClick = (event: MouseEvent) => {
  emit('click', event);
};
</script>

<template>
  <MDChipBase
    type="filter"
    :label="label"
    :elevated="elevated"
    :selected="selected"
    :draggable="draggable"
    :autofocus="autofocus"
    :disabled="disabled"
    @click="onClick"
  >
    <template v-if="$slots.trailingIcon" #trailingIcon>
      <slot name="trailingIcon" />
    </template>
  </MDChipBase>
</template>
