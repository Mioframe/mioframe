<script setup lang="ts">
import { PlaygroundOptionalBoolean, PlaygroundStory } from '@shared/lib/playground';
import MDCheckbox from './MDCheckbox.vue';
import { useQueryValue } from '@shared/lib/useQueryState';

type State = {
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  indeterminate?: boolean | undefined;
  readonly?: boolean | undefined;
  modelValue?: boolean | undefined;
};

const state = useQueryValue<State>('state', {
  disabled: undefined,
  error: undefined,
  indeterminate: undefined,
  readonly: undefined,
  modelValue: undefined,
});
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <PlaygroundOptionalBoolean v-model:model-value="state.disabled" label="disabled" />

      <PlaygroundOptionalBoolean v-model:model-value="state.error" label="error" />

      <PlaygroundOptionalBoolean v-model:model-value="state.indeterminate" label="indeterminate" />

      <PlaygroundOptionalBoolean v-model:model-value="state.readonly" label="readonly" />
    </template>

    <template #space>
      <MDCheckbox
        v-model:model-value="state.modelValue"
        :disabled="state.disabled"
        :error="state.error"
        :indeterminate="state.indeterminate"
        :readonly="state.readonly"
      />
    </template>
  </PlaygroundStory>
</template>
