<script setup lang="ts">
import { computed, ref } from 'vue';

const stateValue = ref<number>();

const props = defineProps<{
  value?: number;
  label: string;
}>();

const emit = defineEmits<{
  'update:value': [value?: number];
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
        v-model.number="modelValue"
        class="input"
        type="number"
        :placeholder="label"
      />
    </div>
  </div>
</template>
