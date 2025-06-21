<script setup lang="ts">
import { PlaygroundStory } from '@shared/lib/playground';
import { useQueryState } from '@shared/lib/useQueryState';
import type { ComponentProps } from 'vue-component-type-helpers';
import MDChip from './MDChip.vue';
import { MDSymbol } from '../Icon';

interface State extends ComponentProps<typeof MDChip> {
  leadingIcon: boolean;
  trailingIcon: boolean;
}

const typeOptions: State['type'][] = ['assist', 'filter', 'input'];

const state = useQueryState<State>('state', {
  label: 'label',
  type: 'assist',
  elevated: undefined,
  selected: undefined,
  leadingIcon: false,
  trailingIcon: false,
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

      <label>
        leadingIcon
        <input v-model="state.leadingIcon" type="checkbox" />
      </label>

      <label>
        trailingIcon
        <input v-model="state.trailingIcon" type="checkbox" />
      </label>
    </template>

    <template #space>
      <MDChip
        :elevated="state.elevated"
        :label="state.label"
        :selected="state.selected"
        :type="state.type"
      >
        <template v-if="state.leadingIcon" #leadingIcon>
          <MDSymbol name="broken_image" />
        </template>

        <template v-if="state.trailingIcon" #trailingIcon>
          <MDSymbol name="broken_image" />
        </template>
      </MDChip>
    </template>
  </PlaygroundStory>
</template>
