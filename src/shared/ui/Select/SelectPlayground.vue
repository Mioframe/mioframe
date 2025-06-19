<script setup lang="ts">
import PlaygroundStore from '@shared/lib/playground/PlaygroundStory.vue';
import MDSelect from './MDSelect.vue';

const initialState = {
  labelText: 'labelText',
  modelValue: [],
};

const options = Array(15)
  .fill(0)
  .map((_, index) => ({ labelText: `option #${index}` }));
</script>

<template>
  <PlaygroundStore :initial-state>
    <template #controllers="{ state }">
      <input v-model="state.labelText" placeholder="labelText" />

      <code>{{ state.modelValue }}</code>
    </template>

    <template #space="{ state }">
      <MDSelect
        v-model="state.modelValue"
        :label-text="state.labelText"
        :options
      />
    </template>
  </PlaygroundStore>
</template>
