<script setup lang="ts">
import { dayjs } from '@shared/lib/dayjs';
import { Dayjs } from 'dayjs';
import { isNil, isNumber, isString } from 'lodash-es';
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

// todo: разместить date в таблице
</script>

<template>
  <time :datetime>{{ formatValue }}</time>
</template>
