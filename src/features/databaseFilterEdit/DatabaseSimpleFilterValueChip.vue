<script setup lang="ts">
import { MDChip } from '@shared/ui/Chips';
import { computed, toRefs } from 'vue';
import { OPERATOR_LABEL } from './types';
import type { UNARY_FILTER_OPERATOR } from '@shared/lib/databaseDocument/migrations/versions/v2/view/filter';
import type { DatabaseValue } from '@shared/lib/databaseDocument';
import { toString } from 'es-toolkit/compat';

const props = defineProps<{
  operator: UNARY_FILTER_OPERATOR;
  value: DatabaseValue;
}>();

const { operator, value } = toRefs(props);

const emit = defineEmits<{
  clickClose: [];
  click: [];
}>();

const valueString = computed(() => toString(value.value));

const label = computed(
  () => `${OPERATOR_LABEL[operator.value]} "${valueString.value}"`,
);
</script>

<template>
  <MDChip
    class="db-simple-filter-value"
    type="input"
    :label="label"
    @click-close="emit('clickClose')"
    @click="emit('click')"
  />
</template>
