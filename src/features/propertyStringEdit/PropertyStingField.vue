<script setup lang="ts">
import { isString } from 'lodash-es';
import { computed, ref } from 'vue';

const stateValue = ref<string>();

const props = defineProps<{
  value?: unknown;
  label: string;
}>();

const emit = defineEmits<{
  'update:value': [value?: string];
}>();

const modelValue = computed<string | undefined>({
  get: () => (isString(props.value) ? props.value : stateValue.value),
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
