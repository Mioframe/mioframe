<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  value?: unknown;
  label?: string;
}>();

const emit = defineEmits<{
  'update:value': [value?: boolean];
}>();

const modelValue = computed<boolean>({
  get: () => !!props.value,
  set: (v) => {
    emit('update:value', v);
  },
});
</script>

<template>
  <div class="field">
    <label class="checkbox">
      <input v-model="modelValue" type="checkbox" />
      {{ label }}
    </label>
  </div>
</template>
