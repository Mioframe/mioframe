<script setup lang="ts">
import { isNumber } from 'lodash-es';
import { computed, ref } from 'vue';

const stateValue = ref<number>();

const props = defineProps<{
  value?: unknown;
  label?: string;
}>();

const emit = defineEmits<{
  'update:value': [value?: number];
  keydown: [payload: KeyboardEvent];
}>();

const modelValue = computed<number | undefined>({
  get: () => (isNumber(props.value) ? props.value : stateValue.value),
  set: (v) => {
    stateValue.value = v;
    emit('update:value', stateValue.value);
  },
});
</script>

<template>
  <div class="field">
    <label v-if="label?.length" class="label">{{ label }}</label>

    <div class="control">
      <input
        v-model.number="modelValue"
        class="input"
        type="number"
        step="any"
        :placeholder="label"
        @keydown="$emit('keydown', $event)"
      />
    </div>
  </div>
</template>
