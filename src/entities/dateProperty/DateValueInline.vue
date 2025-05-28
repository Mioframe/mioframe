<script setup lang="ts">
import { dayjs } from '@shared/lib/dayjs';
import { Dayjs } from 'dayjs';
import { isNil, isString } from 'es-toolkit';
import { isNumber } from 'es-toolkit/compat';
import { computed } from 'vue';

const props = defineProps<{
  value: unknown;
}>();

const dayjsValue = computed(() => {
  const v = props.value;
  if (
    !isNil(v) &&
    (isString(v) || isNumber(v) || v instanceof Date || v instanceof Dayjs)
  ) {
    return dayjs(v);
  }
  return undefined;
});

const formatValue = computed(() => dayjsValue.value?.format('l'));

const datetime = computed(() => dayjsValue.value?.format('YYYY-MM-DD'));
</script>

<template>
  <time v-if="formatValue" :datetime>{{ formatValue }}</time>

  <span v-else>undefined</span>
</template>
