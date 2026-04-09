<script setup lang="ts">
import {
  PlaygroundOptionalString,
  PlaygroundStory,
  PlaygroundString,
  PlaygroundUnion,
} from '@shared/lib/playground';
import { MDFab } from '.';
import type { ComponentProps } from 'vue-component-type-helpers';
import { useQueryValue } from '@shared/lib/useQueryState';

interface State extends ComponentProps<typeof MDFab> {}

const state = useQueryValue<State>('state', {
  tooltip: 'tooltip',
  loading: undefined,
  size: undefined,
  color: undefined,
  mdSymbol: undefined,
});

const sizeOptions = ['medium', 'large', undefined] as const;

const colorOptions: State['color'][] = [
  'primary',
  'secondary',
  'tertiary',
  'tonal-primary',
  'tonal-secondary',
  'tonal-tertiary',
  undefined,
] as const;
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <PlaygroundString v-model:model-value="state.tooltip" label="tooltip" />

      <PlaygroundUnion v-model:model-value="state.size" label="size" :options="sizeOptions" />

      <PlaygroundUnion v-model:model-value="state.color" label="color" :options="colorOptions" />

      <PlaygroundOptionalString v-model:model-value="state.mdSymbol" label="mdSymbol" />
    </template>

    <template #space>
      <MDFab
        :loading="state.loading"
        :size="state.size"
        :tooltip="state.tooltip"
        :color="state.color"
        :md-symbol="state.mdSymbol"
      />
    </template>
  </PlaygroundStory>
</template>
