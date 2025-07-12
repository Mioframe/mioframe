<script setup lang="ts">
import { MDCheckbox } from '@shared/ui/Checkbox';
import { isBoolean } from 'es-toolkit';
import { computed } from 'vue';

const { value } = defineProps<{
  value: unknown;
  editable?: boolean;
}>();

const emit = defineEmits<{ click: [] }>();

const convertedValue = computed(() => (isBoolean(value) ? value : undefined));
</script>

<template>
  <MDCheckbox
    :model-value="convertedValue"
    indeterminate
    :readonly="!editable"
    @click="emit('click')"
  />
</template>
