<script setup lang="ts">
import { isUndefined } from 'es-toolkit';
import { useTemplateRef, watchEffect } from 'vue';

defineProps<{ label: string }>();

const value = defineModel<boolean | undefined>({ default: undefined });

const onClickBoolean = () => {
  value.value = isUndefined(value.value) ? true : value.value ? false : undefined;
};

const inputEl = useTemplateRef('inputEl');

watchEffect(() => {
  if (inputEl.value) {
    if (isUndefined(value.value)) {
      inputEl.value.indeterminate = true;
      inputEl.value.checked = false;
    } else {
      inputEl.value.indeterminate = false;
      inputEl.value.checked = value.value;
    }
  }
});
</script>

<template>
  <label>
    {{ label }}
    <input ref="inputEl" type="checkbox" @click="onClickBoolean" />
  </label>
</template>
