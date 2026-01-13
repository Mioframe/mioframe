<script setup lang="ts">
import { computed } from 'vue';
import { OPERATOR_LABEL } from './constants';
import { hasKey } from '@shared/lib/typeGuards/hasOwnKey';

const props = defineProps<{
  operator: string;
}>();

const label = computed((): string => {
  const operator = props.operator;
  if (hasKey(OPERATOR_LABEL, operator)) {
    return OPERATOR_LABEL[operator];
  }
  return props.operator;
});
</script>

<template>
  <span class="operator">{{ label }}</span>
</template>
