<script setup lang="ts">
import {
  PlaygroundBoolean,
  PlaygroundNumber,
  PlaygroundStory,
} from '@shared/lib/playground';
import { MDListContainer, MDListItem } from '../Lists';
import { MDPane, MDSplitLayout } from '../Layout';
import { useQueryValue } from '@shared/lib/useQueryState';
import type { ComponentProps } from 'vue-component-type-helpers';
import { MDToolbarContainer } from '../Toolbar';
import MDBottomSheet from './MDBottomSheet2.vue';

interface State extends ComponentProps<typeof MDBottomSheet> {
  bodyElementsNumber: number;
  show: boolean;
}

const state = useQueryValue<State>('state', {
  bodyElementsNumber: 10,
  show: true,
  label: 'Bottom Sheet',
});
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <PlaygroundBoolean v-model:model-value="state.show" label="show" />

      <PlaygroundNumber
        v-model:model-value="state.bodyElementsNumber"
        :min="0"
        label="bodyElementsNumber"
      />
    </template>

    <template #space>
      <MDSplitLayout>
        <template #main>
          <MDPane>
            <MDToolbarContainer type="floating">
              <MDBottomSheet
                v-if="state.show"
                :label="state.label"
                @closed="state.show = false"
              >
                <MDListContainer v-if="state.bodyElementsNumber > 0">
                  <MDListItem
                    v-for="i in state.bodyElementsNumber"
                    :key="i"
                    :headline="`body item ${i}`"
                  />
                </MDListContainer>

                <MDListContainer v-if="state.bodyElementsNumber > 0">
                  <MDListItem
                    v-for="i in state.bodyElementsNumber"
                    :key="i"
                    :headline="`body item ${i}`"
                  />
                </MDListContainer>

                <MDListContainer v-if="state.bodyElementsNumber > 0">
                  <MDListItem
                    v-for="i in state.bodyElementsNumber"
                    :key="i"
                    :headline="`body item ${i}`"
                  />
                </MDListContainer>
              </MDBottomSheet>
            </MDToolbarContainer>
          </MDPane>
        </template>

        <template #second>
          <MDPane />
        </template>
      </MDSplitLayout>
    </template>
  </PlaygroundStory>
</template>
