<script
  setup
  lang="ts"
  generic="Key extends string | number, Value, T extends Option<Key, Value>"
>
import { isArray, isUndefined } from 'lodash-es';
import type { Option } from './types';
import { computed } from 'vue';

const props = defineProps<{
  value: Value[];
  options: T[];
  multiple?: boolean;
}>();

const emit = defineEmits<{
  'update:value': [Value[]];
}>();

defineSlots<{
  option(option: T): unknown;
}>();

const valueModel = computed({
  get: () => {
    return props.multiple ? props.value : props.value.at(0);
  },
  set: (v) => {
    const updatedValue: Value[] = isUndefined(v) ? [] : isArray(v) ? v : [v];
    emit('update:value', updatedValue);
  },
});
</script>

<template>
  <span class="select">
    <select v-model="valueModel" :multiple>
      <option v-for="option in options" :key="option.key" :value="option.value">
        <slot name="option" v-bind="option">
          {{ option.value }}
        </slot>
      </option>
    </select>
  </span>
</template>
