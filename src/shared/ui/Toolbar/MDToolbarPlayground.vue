<script setup lang="ts">
import {
  PlaygroundOptionalBoolean,
  PlaygroundStory,
  PlaygroundUnion,
} from '@shared/lib/playground';
import MDToolbarContainer from './MDToolbarContainer.vue';
import { MDIconButton } from '../Button';
import { useQueryValue } from '@shared/lib/useQueryState';
import type { ComponentProps } from 'vue-component-type-helpers';
import { MDPaneContainer } from '../Layers';

interface State extends ComponentProps<typeof MDToolbarContainer> {}

const state = useQueryValue<State>('state', {
  type: 'docked',
  centerAligned: undefined,
  color: undefined,
  layout: undefined,
});

const typeOptions: State['type'][] = ['docked', 'floating'];
const colorOptions: State['color'][] = [undefined, 'standard', 'vibrant'];
const layoutOptions: State['layout'][] = [undefined, 'horizontal', 'vertical'];
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <PlaygroundUnion
        v-model:model-value="state.type"
        label="type"
        :options="typeOptions"
      />

      <PlaygroundOptionalBoolean
        v-model:model-value="state.centerAligned"
        label="centerAligned"
      />

      <PlaygroundUnion
        v-model:model-value="state.color"
        label="color"
        :options="colorOptions"
      />

      <PlaygroundUnion
        v-model:model-value="state.layout"
        label="layout"
        :options="layoutOptions"
      />
    </template>

    <template #space>
      <MDPaneContainer class="container">
        <button v-for="i in 16" :key="i" type="button" class="md-margin-top-6">
          {{ i }}
        </button>

        <MDToolbarContainer
          :type="state.type"
          :center-aligned="state.centerAligned"
          :color="state.color"
          :layout="state.layout"
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
      </MDPaneContainer>
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
