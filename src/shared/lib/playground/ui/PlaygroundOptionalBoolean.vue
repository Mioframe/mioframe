<script setup lang="ts">
import { useTemplateRef, watchEffect } from 'vue';

defineProps<{ label: string }>();

const value = defineModel<boolean>();

const onClickBoolean = () => {
  value.value =
    value.value === undefined ? true : value.value ? false : undefined;
};

const inputEl = useTemplateRef('inputEl');

watchEffect(() => {
  if (inputEl.value) {
    inputEl.value.indeterminate = value.value === undefined;
  }
});
</script>

<template>
  <label>
    {{ label }}
    <input ref="inputEl" type="checkbox" @click="onClickBoolean" />
  </label>
</template>
