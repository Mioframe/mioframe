<script setup lang="ts">
import type { UNARY_FILTER_OPERATOR } from '@shared/lib/databaseDocument';
import { MDMenuItemBase } from '@shared/ui/Menu';
import { OPERATOR_LABEL } from '@shared/ui/Query/constants';
import { computed } from 'vue';

const props = defineProps<{
  operator: UNARY_FILTER_OPERATOR;
}>();

const emit = defineEmits<{
  click: [];
}>();

const label = computed(() => OPERATOR_LABEL[props.operator]);

const onClick = () => {
  emit('click');
};
</script>

<template>
  <MDMenuItemBase :label="label" @click="onClick" />
</template>
