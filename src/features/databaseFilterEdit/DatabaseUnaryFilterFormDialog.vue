<script setup lang="ts">
import { OPERATOR_LABEL } from '@entity/databaseFilter/types';
import type { UNARY_FILTER_OPERATOR } from '@shared/lib/databaseDocument';
import { MDDialog } from '@shared/ui/Dialog';
import { computed, toRefs } from 'vue';

const props = defineProps<{
  operator: UNARY_FILTER_OPERATOR;
}>();

const { operator } = toRefs(props);

const modelShow = defineModel<boolean>('show', { required: true });

const emit = defineEmits<{
  apply: [];
  cancel: [];
}>();

defineSlots<{
  valueField: () => unknown;
}>();

const filterLabel = computed(() => OPERATOR_LABEL[operator.value]);

const headline = 'Filter settings';
const supportingText = computed(
  () => `Add filter value "${filterLabel.value}"`,
);

const onApply = () => {
  emit('apply');
};

const onCancel = () => {
  emit('cancel');
};
</script>

<template>
  <MDDialog
    v-model:show="modelShow"
    :headline="headline"
    :supporting-text="supportingText"
    has-cancel-action
    @apply="onApply"
    @cancel="onCancel"
  >
    <template #default>
      <slot name="valueField" />
    </template>
  </MDDialog>
</template>
