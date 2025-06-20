<script setup lang="ts">
import { PlaygroundStory } from '@shared/lib/playground';
import MDTextField from './MDTextField.vue';
import { useQueryState } from '@shared/lib/useQueryState';
import type { ComponentProps } from 'vue-component-type-helpers';

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

const state = useQueryState<ComponentProps<typeof MDTextField>>('state', {
  labelText: 'labelText',
  modelValue: undefined,
  disabled: false,
  error: false,
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
      <pre>{{ state.modelValue }}</pre>

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
        inputType
        <select v-model="state.inputType">
          <option
            v-for="option in inputTypeOptions"
            :key="option"
            :value="option"
          >
            {{ option }}
          </option>
        </select>
      </label>

      <label>
        maxCharacters
        <input v-model="state.maxCharacters" type="number" />
      </label>

      <label>
        readonly
        <input v-model="state.readonly" type="checkbox" />
      </label>

      <label>
        supportingText
        <input v-model="state.supportingText" type="text" />
      </label>

      <label>
        type
        <select v-model="state.type">
          <option v-for="option in typeOptions" :key="option" :value="option">
            {{ option }}
          </option>
        </select>
      </label>
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
