<script setup lang="ts">
import { MDCheckbox } from '@shared/ui/Checkbox';
import { isBoolean } from 'lodash-es';
import { computed } from 'vue';

const { value } = defineProps<{
  value: unknown;
}>();

const convertedValue = computed(() => (isBoolean(value) ? value : undefined));
</script>

<template>
  <MDCheckbox :model-value="convertedValue" indeterminate />
</template>
