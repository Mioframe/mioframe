<script setup lang="ts">
import { MDCheckbox } from '@shared/ui/Checkbox';
import { isBoolean } from 'es-toolkit';
import { computed, toRefs } from 'vue';
import type { BooleanProperty } from './boolean';

const props = withDefaults(
  defineProps<{
    value: unknown;
    editable?: boolean;
    property: BooleanProperty;
    tabIndex?: number;
  }>(),
  {
    tabIndex: 0,
  },
);

const emit = defineEmits<{ click: [] }>();

const { value, property } = toRefs(props);

const name = computed(() => property.value.name);

const indeterminate = computed(() => property.value.indeterminate);

const convertedValue = computed(() =>
  isBoolean(value.value) ? value.value : property.value.default,
);

const onClick = () => {
  emit('click');
};
</script>

<template>
  <MDCheckbox
    :model-value="convertedValue"
    :indeterminate="indeterminate"
    :readonly="!editable"
    :tab-index="tabIndex"
    :tooltip="name"
    @click="onClick"
  />
</template>
