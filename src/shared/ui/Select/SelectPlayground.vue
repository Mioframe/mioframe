<script setup lang="ts">
import PlaygroundStore from '@shared/lib/playground/PlaygroundStory.vue';
import MDSelect from './MDSelect.vue';
import type { ComponentProps } from 'vue-component-type-helpers';
import { useQueryState } from '@shared/lib/useQueryState';

const options = Array(15)
  .fill(0)
  .map((_, index) => ({ labelText: `option #${index}` }));

const typeOptions = ['filled', 'outlined', undefined];

const state = useQueryState<ComponentProps<typeof MDSelect>>('state', {
  labelText: 'labelText',
  modelValue: [],
  options: [],
  disabled: undefined,
  error: undefined,
  multiple: undefined,
  supportingText: undefined,
  type: undefined,
});
</script>

<template>
  <PlaygroundStore>
    <template #controllers>
      <label>
        labelText
        <input v-model="state.labelText" placeholder="labelText" />
      </label>

      <label>
        disabled
        <input v-model="state.disabled" type="checkbox" />
      </label>

      <label>
        error
        <input v-model="state.error" type="checkbox" />
      </label>

      <label>
        multiple
        <input v-model="state.multiple" type="checkbox" />
      </label>

      <label>
        supportingText
        <input v-model="state.supportingText" />
      </label>

      <label>
        type
        <select v-model="state.type">
          <option v-for="option in typeOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </label>

      <pre>{{ state.modelValue }}</pre>
    </template>

    <template #space>
      <MDSelect
        v-model="state.modelValue"
        :label-text="state.labelText"
        :options
        :disabled="state.disabled"
        :error="state.error"
        :multiple="state.multiple"
        :supporting-text="state.supportingText"
        :type="state.type"
      />
    </template>
  </PlaygroundStore>
</template>
