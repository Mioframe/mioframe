<script setup lang="ts">
import { PlaygroundStory } from '@shared/lib/playground';
import MDFieldContainer from './MDFieldContainer.vue';

const typeOptions = ['filled', 'outlined', undefined] as const;

const initialState = {
  labelText: 'labelText',
  disabled: false,
  error: false,
  maxCharacters: undefined,
  supportingText: undefined,
  type: undefined,
  filled: undefined,
  numberCharacters: undefined,
};
</script>

<template>
  <PlaygroundStory :initial-state>
    <template #controllers="{ state }">
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
        maxCharacters
        <input v-model="state.maxCharacters" type="number" />
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

      <label>
        filled
        <input v-model="state.filled" type="checkbox" />
      </label>

      <label>
        numberCharacters
        <input v-model="state.numberCharacters" type="number" />
      </label>
    </template>

    <template #space="{ state }">
      <MDFieldContainer
        :label-text="state.labelText"
        :disabled="state.disabled"
        :error="state.error"
        :max-characters="state.maxCharacters"
        :supporting-text="state.supportingText"
        :type="state.type"
        :filled="state.filled"
        :number-characters="state.numberCharacters"
      />
    </template>
  </PlaygroundStory>
</template>
