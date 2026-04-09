<script setup lang="ts">
import {
  PlaygroundOptionalBoolean,
  PlaygroundOptionalNumber,
  PlaygroundOptionalString,
  PlaygroundStory,
  PlaygroundString,
  PlaygroundUnion,
} from '@shared/lib/playground';
import MDTextField from './MDTextField.vue';
import { useQueryValue } from '@shared/lib/useQueryState';

type InputType =
  | 'number'
  | 'time'
  | 'text'
  | 'color'
  | 'date'
  | 'datetime-local'
  | 'email'
  | 'month'
  | 'password'
  | 'search'
  | 'tel'
  | 'url'
  | 'week'
  | 'multiline';

type State = {
  labelText: string;
  modelValue?: string | undefined;
  disabled?: boolean | undefined;
  error?: boolean | undefined;
  inputType?: InputType | undefined;
  maxCharacters?: number | undefined;
  readonly?: boolean | undefined;
  supportingText?: string | undefined;
  type?: 'filled' | 'outlined' | undefined;
};

const inputTypeOptions = [
  'number',
  'time',
  'text',
  'color',
  'date',
  'datetime-local',
  'email',
  'month',
  'password',
  'search',
  'tel',
  'url',
  'week',
  'multiline',
  undefined,
] as const;

const typeOptions = ['filled', 'outlined', undefined] as const;

const state = useQueryValue<State>('state', {
  labelText: 'labelText',
  modelValue: undefined,
  disabled: undefined,
  error: undefined,
  inputType: undefined,
  maxCharacters: undefined,
  readonly: undefined,
  supportingText: undefined,
  type: undefined,
});
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <div>
        value:
        <code>{{ [state.modelValue] }}</code>
      </div>

      <PlaygroundString v-model:model-value="state.labelText" label="labelText" />

      <PlaygroundOptionalBoolean v-model:model-value="state.disabled" label="disabled" />

      <PlaygroundOptionalBoolean v-model:model-value="state.error" label="error" />

      <PlaygroundUnion
        v-model:model-value="state.inputType"
        label="inputType"
        :options="inputTypeOptions"
      />

      <PlaygroundOptionalNumber v-model:model-value="state.maxCharacters" label="maxCharacters" />

      <PlaygroundOptionalBoolean v-model:model-value="state.readonly" label="readonly" />

      <PlaygroundOptionalString v-model:model-value="state.supportingText" label="supportingText" />

      <PlaygroundUnion v-model:model-value="state.type" label="type" :options="typeOptions" />
    </template>

    <template #space>
      <MDTextField
        v-model:model-value="state.modelValue"
        :label-text="state.labelText"
        :disabled="state.disabled"
        :error="state.error"
        :input-type="state.inputType"
        :max-characters="state.maxCharacters"
        :readonly="state.readonly"
        :supporting-text="state.supportingText"
        :type="state.type"
      />
    </template>
  </PlaygroundStory>
</template>
