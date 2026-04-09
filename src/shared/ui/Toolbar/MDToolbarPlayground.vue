<script setup lang="ts">
import {
  PlaygroundNumber,
  PlaygroundOptionalBoolean,
  PlaygroundStory,
  PlaygroundUnion,
} from '@shared/lib/playground';
import MDToolbarContainer from './MDToolbarContainer.vue';
import { MDIconButton } from '../Button';
import { useQueryValue } from '@shared/lib/useQueryState';
import { MDPane } from '../Layout';
import { MDListContainer, MDListItem } from '../Lists';

type State = {
  type: 'docked' | 'floating';
  centerAligned?: boolean | undefined;
  color?: 'standard' | 'vibrant' | undefined;
  layout?: 'horizontal' | 'vertical' | undefined;
  autoHide?: boolean | undefined;
  numberItems: number;
};

const state = useQueryValue<State>('state', {
  type: 'docked',
  centerAligned: undefined,
  color: undefined,
  layout: undefined,
  autoHide: undefined,
  numberItems: 10,
});

const typeOptions = ['docked', 'floating'] as const;
const colorOptions = [undefined, 'standard', 'vibrant'] as const;
const layoutOptions = [undefined, 'horizontal', 'vertical'] as const;
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <PlaygroundNumber
        v-model:model-value="state.numberItems"
        label="numberItems"
        :min="0"
        :step="1"
      />

      <PlaygroundUnion v-model:model-value="state.type" label="type" :options="typeOptions" />

      <PlaygroundOptionalBoolean v-model:model-value="state.autoHide" label="autoHide" />

      <PlaygroundOptionalBoolean v-model:model-value="state.centerAligned" label="centerAligned" />

      <PlaygroundUnion v-model:model-value="state.color" label="color" :options="colorOptions" />

      <PlaygroundUnion v-model:model-value="state.layout" label="layout" :options="layoutOptions" />
    </template>

    <template #space>
      <MDPane class="container">
        <MDListContainer>
          <MDListItem v-for="i in state.numberItems" :key="i" :headline="`item ${i}`" />
        </MDListContainer>

        <MDToolbarContainer
          :type="state.type"
          :center-aligned="state.centerAligned"
          :color="state.color"
          :layout="state.layout"
          :auto-hide="state.autoHide"
          class="md-margin-top-4"
        >
          <MDIconButton tooltip="view settings" md-symbol-name="view_quilt" />

          <MDIconButton tooltip="sort" md-symbol-name="sort_by_alpha" />

          <MDIconButton tooltip="filter" md-symbol-name="filter_alt" />

          <MDIconButton
            tooltip="add a entry"
            md-symbol-name="forms_add_on"
            color="filled"
            shape="square"
          />

          <MDIconButton tooltip="configure properties" md-symbol-name="tune" />

          <!-- <MDIconButton tooltip="button 5" md-symbol-name="more_vert" /> -->
        </MDToolbarContainer>
      </MDPane>
    </template>
  </PlaygroundStory>
  <!-- todo: надо делать проще, сначала просто контейнер, потом его позиционирование с помощью обёртки телепорта -->
</template>

<style lang="css" scoped>
.container {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
}
</style>
