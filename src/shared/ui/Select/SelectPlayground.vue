<script setup lang="ts">
import PlaygroundStore from '@shared/lib/playground/PlaygroundStory.vue';
import MDSelect from './MDSelect.vue';
import type { ComponentProps } from 'vue-component-type-helpers';
import { useQueryValue } from '@shared/lib/useQueryState';
import {
  PlaygroundOptionalBoolean,
  PlaygroundOptionalString,
  PlaygroundString,
  PlaygroundUnion,
} from '@shared/lib/playground';
import type { SelectOption } from './types';

const options = Array(15)
  .fill(0)
  .map(
    (_, index): SelectOption => ({
      label: `option #${index}`,
      key: index,
    }),
  );

const typeOptions = ['filled', 'outlined', undefined];

const state = useQueryValue<ComponentProps<typeof MDSelect>>('state', {
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
      <PlaygroundString
        v-model:model-value="state.labelText"
        label="labelText"
      />

      <PlaygroundOptionalBoolean
        v-model:model-value="state.disabled"
        label="disabled"
      />

      <PlaygroundOptionalBoolean
        v-model:model-value="state.error"
        label="error"
      />

      <PlaygroundOptionalBoolean
        v-model:model-value="state.multiple"
        label="multiple"
      />

      <PlaygroundOptionalString
        v-model:model-value="state.supportingText"
        label="supportingText"
      />

      <PlaygroundUnion
        v-model:model-value="state.type"
        label="type"
        :options="typeOptions"
      />

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
