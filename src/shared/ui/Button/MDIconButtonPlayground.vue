<script setup lang="ts">
import {
  PlaygroundOptionalBoolean,
  PlaygroundOptionalString,
  PlaygroundStory,
  PlaygroundString,
  PlaygroundUnion,
} from '@shared/lib/playground';
import { useQueryState } from '@shared/lib/useQueryState';
import type { ComponentProps } from 'vue-component-type-helpers';
import MDIconButton from './MDIconButton.vue';

interface State extends ComponentProps<typeof MDIconButton> {}

const colorOptions = [
  'filled',
  'outlined',
  'tonal',
  'standard',
  undefined,
] as const;

const formActionOptions = ['submit', 'reset', undefined] as const;

const shapeOptions = ['round', 'square', undefined] as const;

const sizeOptions = [
  'extra-small',
  'small',
  'medium',
  'large',
  'extra-large',
  undefined,
] as const;

const typeOptions = ['default', 'toggle', undefined] as const;

const widthOptions = ['default', 'narrow', 'wide', undefined] as const;

const state = useQueryState<State>('state', {
  tooltip: 'tooltip',
  color: undefined,
  disabled: undefined,
  focused: undefined,
  formAction: undefined,
  loading: undefined,
  mdSymbolName: undefined,
  pressed: undefined,
  selected: undefined,
  shape: undefined,
  showTooltipOnClick: undefined,
  size: undefined,
  type: undefined,
  width: undefined,
});
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <PlaygroundString v-model:model-value="state.tooltip" label="tooltip" />

      <PlaygroundUnion
        v-model:model-value="state.color"
        label="color"
        :options="colorOptions"
      />

      <PlaygroundOptionalBoolean
        v-model:model-value="state.disabled"
        label="disabled"
      />

      <PlaygroundOptionalBoolean
        v-model:model-value="state.focused"
        label="focused"
      />

      <PlaygroundUnion
        v-model:model-value="state.formAction"
        label="formAction"
        :options="formActionOptions"
      />

      <PlaygroundOptionalString
        v-model:model-value="state.mdSymbolName"
        label="mdSymbolName"
      />

      <PlaygroundOptionalBoolean
        v-model:model-value="state.pressed"
        label="pressed"
      />

      <PlaygroundOptionalBoolean
        v-model:model-value="state.selected"
        label="selected"
      />

      <PlaygroundUnion
        v-model:model-value="state.shape"
        label="shape"
        :options="shapeOptions"
      />

      <PlaygroundOptionalBoolean
        v-model:model-value="state.showTooltipOnClick"
        label="showTooltipOnClick"
      />

      <PlaygroundUnion
        v-model:model-value="state.size"
        label="size"
        :options="sizeOptions"
      />

      <PlaygroundUnion
        v-model:model-value="state.type"
        label="type"
        :options="typeOptions"
      />

      <PlaygroundUnion
        v-model:model-value="state.width"
        label="width"
        :options="widthOptions"
      />
    </template>

    <template #space>
      <MDIconButton
        :color="state.color"
        :disabled="state.disabled"
        :focused="state.focused"
        :form-action="state.formAction"
        :loading="state.loading"
        :md-symbol-name="state.mdSymbolName"
        :pressed="state.pressed"
        :selected="state.selected"
        :shape="state.shape"
        :show-tooltip-on-click="state.showTooltipOnClick"
        :size="state.size"
        :tooltip="state.tooltip"
        :type="state.type"
        :width="state.width"
      />
    </template>
  </PlaygroundStory>
</template>
