<script setup lang="ts">
import { PlaygroundStory } from '@shared/lib/playground';
import MDRichTooltip from './MDRichTooltip.vue';
import { MDButton } from '../Button';
import { useQueryValue } from '@shared/lib/useQueryState';
import type { ComponentProps } from 'vue-component-type-helpers';
import { useTemplateRef } from 'vue';
import type { VueInstance } from '@vueuse/core';

const state = useQueryValue<ComponentProps<typeof MDRichTooltip>>('state', {
  subhead: '',
  useHover: undefined,
  useClick: undefined,
  show: undefined,
  disabledTeleport: undefined,
});

const targetEl = useTemplateRef<VueInstance>('targetEl');
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <label>
        subhead
        <input v-model="state.subhead" type="text" />
      </label>

      <label>
        useHover
        <input v-model="state.useHover" type="checkbox" />
      </label>

      <label>
        useClick
        <input v-model="state.useClick" type="checkbox" />
      </label>

      <label>
        show
        <input v-model="state.show" type="checkbox" />
      </label>

      <label>
        disabledTeleport
        <input v-model="state.disabledTeleport" type="checkbox" />
      </label>
    </template>

    <template #space>
      <MDButton ref="targetEl" label="rich tooltip trigger" />

      <MDRichTooltip
        :target-element="targetEl"
        :subhead="state.subhead"
        :use-hover="state.useHover"
        :use-click="state.useClick"
        :disabled-teleport="state.disabledTeleport"
        :show="state.show"
      >
        <template #text>
          text text text text text text text text text text text text text text
          text text text text text text
        </template>

        <template #actions>
          <MDButton label="action 1" />

          <MDButton label="action 2" />
        </template>
      </MDRichTooltip>
    </template>
  </PlaygroundStory>
</template>

<style scoped>
.grid {
  display: flex;
  flex-wrap: wrap;
  padding: 16px;
  gap: 16px;
  justify-content: center;
  align-items: center;
}
</style>
