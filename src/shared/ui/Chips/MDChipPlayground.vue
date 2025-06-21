<script setup lang="ts">
import { PlaygroundStory } from '@shared/lib/playground';
import { useQueryState } from '@shared/lib/useQueryState';
import type { ComponentProps } from 'vue-component-type-helpers';
import MDChip from './MDChip.vue';

type Props = ComponentProps<typeof MDChip>;

const typeOptions: Props['type'][] = ['assist', 'filter'];

const state = useQueryState<Props>('state', {
  label: 'label',
  type: 'assist',
  elevated: undefined,
  selected: undefined,
});
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <label>
        label
        <input v-model="state.label" />
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
        elevated
        <input v-model="state.elevated" type="checkbox" />
      </label>

      <label>
        selected
        <input v-model="state.selected" type="checkbox" />
      </label>
    </template>

    <template #space>
      <MDChip
        :elevated="state.elevated"
        :label="state.label"
        :selected="state.selected"
        :type="state.type"
      />
    </template>
  </PlaygroundStory>
</template>
