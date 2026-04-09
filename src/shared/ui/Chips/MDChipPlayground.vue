<script setup lang="ts">
import {
  PlaygroundBoolean,
  PlaygroundOptionalBoolean,
  PlaygroundStory,
  PlaygroundString,
  PlaygroundUnion,
} from '@shared/lib/playground';
import { useQueryValue } from '@shared/lib/useQueryState';
import MDChip from './MDChip.vue';
import { MDSymbol } from '../Icon';

type State = {
  label: string;
  type: 'assist' | 'filter' | 'input';
  elevated?: boolean | undefined;
  selected?: boolean | undefined;
  leadingIcon: boolean;
  trailingIcon: boolean;
};

const typeOptions = ['assist', 'filter', 'input'] as const;

const state = useQueryValue<State>('state', {
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
      <PlaygroundString v-model:model-value="state.label" label="label" />

      <PlaygroundUnion v-model:model-value="state.type" label="type" :options="typeOptions" />

      <PlaygroundOptionalBoolean v-model:model-value="state.elevated" label="elevated" />

      <PlaygroundOptionalBoolean v-model:model-value="state.selected" label="selected" />

      <PlaygroundBoolean v-model:model-value="state.leadingIcon" label="leadingIcon" />

      <PlaygroundBoolean v-model:model-value="state.trailingIcon" label="trailingIcon" />
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
