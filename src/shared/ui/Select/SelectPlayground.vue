<script setup lang="ts">
import PlaygroundStore from '@shared/lib/playground/PlaygroundStory.vue';
import MDSelect from './MDSelect.vue';
import { useQueryValue } from '@shared/lib/useQueryState';
import {
  PlaygroundOptionalBoolean,
  PlaygroundOptionalString,
  PlaygroundString,
  PlaygroundUnion,
} from '@shared/lib/playground';
import type { SelectOption } from './types';
import { simpleFaker } from '@faker-js/faker';

const options = Array(simpleFaker.number.int({ min: 5, max: 15 }))
  .fill(0)
  .map(
    (_, index): SelectOption => ({
      label: simpleFaker.string.alphanumeric({ length: { min: 3, max: 20 } }),
      key: index,
    }),
  );

const typeOptions = ['filled', 'outlined', undefined] as const;

type State = {
  labelText: string;
  modelValue: SelectOption[];
  options: SelectOption[];
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  multiple?: boolean | undefined;
  supportingText?: string | undefined;
  type?: 'filled' | 'outlined' | undefined;
};

const state = useQueryValue<State>('state', {
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
      <PlaygroundString v-model:model-value="state.labelText" label="labelText" />

      <PlaygroundOptionalBoolean v-model:model-value="state.disabled" label="disabled" />

      <PlaygroundOptionalBoolean v-model:model-value="state.error" label="error" />

      <PlaygroundOptionalBoolean v-model:model-value="state.multiple" label="multiple" />

      <PlaygroundOptionalString v-model:model-value="state.supportingText" label="supportingText" />

      <PlaygroundUnion v-model:model-value="state.type" label="type" :options="typeOptions" />

      <pre>{{ state.modelValue }}</pre>
    </template>

    <template #space>
      <MDSelect
        v-model="state.modelValue"
        :label-text="state.labelText"
        :options="options"
        :disabled="state.disabled"
        :error="state.error"
        :multiple="state.multiple"
        :supporting-text="state.supportingText"
        :type="state.type"
      />
    </template>
  </PlaygroundStore>
</template>
