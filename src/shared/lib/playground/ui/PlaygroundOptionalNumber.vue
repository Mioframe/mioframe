<script setup lang="ts">
import { ref, watch, watchEffect } from 'vue';

const value = defineModel<number | undefined>();

const { step = 0.01 } = defineProps<{ label: string; step?: number | undefined }>();

const isNotUndefined = ref(false);

watch(
  isNotUndefined,
  (hasValue) => {
    value.value = hasValue ? 0 : undefined;
  },
  { immediate: true },
);

watchEffect(() => {
  isNotUndefined.value = value.value !== undefined;
});
</script>

<template>
  <label>
    {{ label }}
    <input v-model="isNotUndefined" type="checkbox" />

    <input v-model.number="value" type="number" :disabled="!isNotUndefined" :step="step" />
  </label>
</template>
