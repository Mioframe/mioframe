<script setup lang="ts">
import { computed, ref } from 'vue';

const stateValue = ref<string>();

const props = defineProps<{
  value?: string;
  label: string;
}>();

const emit = defineEmits<{
  'update:value': [value?: string];
}>();

const modelValue = computed({
  get: () => props.value ?? stateValue.value,
  set: (v) => {
    stateValue.value = v;
    emit('update:value', stateValue.value);
  },
});
</script>

<template>
  <div class="field">
    <label class="label">{{ label }}</label>

    <div class="control">
      <input
        v-model="modelValue"
        class="input"
        type="text"
        :placeholder="label"
      />
    </div>
  </div>
</template>
