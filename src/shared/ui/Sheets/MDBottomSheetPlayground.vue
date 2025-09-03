<script setup lang="ts">
import {
  PlaygroundBoolean,
  PlaygroundNumber,
  PlaygroundOptionalBoolean,
  PlaygroundStory,
} from '@shared/lib/playground';
import { MDListContainer, MDListItem } from '../Lists';
import { MDPaneContainer } from '../Layers';
import { useQueryValue } from '@shared/lib/useQueryState';
import type { ComponentProps } from 'vue-component-type-helpers';
import MDBottomSheetSection from './MDBottomSheetSection.vue';
import MDBottomSheet from './MDBottomSheet.vue';

interface State extends ComponentProps<typeof MDBottomSheet> {
  bodyElementsNumber: number;
  show: boolean;
}

const state = useQueryValue<State>('state', {
  bodyElementsNumber: 10,
  show: true,
  collapsed: undefined,
  fullscreen: undefined,
  label: 'Bottom Sheet',
});
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <PlaygroundBoolean v-model:model-value="state.show" label="show" />

      <PlaygroundOptionalBoolean
        v-model:model-value="state.collapsed"
        label="collapsed"
      />

      <PlaygroundOptionalBoolean
        v-model:model-value="state.fullscreen"
        label="fullscreen"
      />

      <PlaygroundNumber
        v-model:model-value="state.bodyElementsNumber"
        :min="0"
        label="bodyElementsNumber"
      />
    </template>

    <template #space>
      <MDPaneContainer>
        <MDBottomSheet
          v-model:collapsed="state.collapsed"
          v-model:fullscreen="state.fullscreen"
          v-model:show="state.show"
          :label="state.label"
        >
          <MDBottomSheetSection>
            <MDListContainer v-if="state.bodyElementsNumber > 0">
              <MDListItem
                v-for="i in state.bodyElementsNumber"
                :key="i"
                :headline="`body item ${i}`"
              />
            </MDListContainer>
          </MDBottomSheetSection>

          <MDBottomSheetSection>
            <MDListContainer v-if="state.bodyElementsNumber > 0">
              <MDListItem
                v-for="i in state.bodyElementsNumber"
                :key="i"
                :headline="`body item ${i}`"
              />
            </MDListContainer>
          </MDBottomSheetSection>

          <MDBottomSheetSection>
            <MDListContainer v-if="state.bodyElementsNumber > 0">
              <MDListItem
                v-for="i in state.bodyElementsNumber"
                :key="i"
                :headline="`body item ${i}`"
              />
            </MDListContainer>
          </MDBottomSheetSection>
        </MDBottomSheet>
      </MDPaneContainer>
    </template>
  </PlaygroundStory>
</template>
