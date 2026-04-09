<script setup lang="ts">
import {
  PlaygroundOptionalBoolean,
  PlaygroundStory,
  PlaygroundString,
  PlaygroundUnion,
} from '@shared/lib/playground';
import MDRichTooltip from './MDRichTooltip.vue';
import { MDButton } from '../Button';
import { useQueryValue } from '@shared/lib/useQueryState';
import { useTemplateRef } from 'vue';
import { UseDraggable } from '@vueuse/components';

type State = {
  subhead: string;
  useHover?: boolean | undefined;
  useClick?: boolean | undefined;
  show?: boolean | undefined;
  disabledTeleport?: boolean | undefined;
  placement?: 'top-start' | 'top-end' | 'bottom-end' | 'bottom-start' | undefined;
};

const state = useQueryValue<State>('state', {
  subhead: '',
  useHover: undefined,
  useClick: undefined,
  show: undefined,
  disabledTeleport: undefined,
  placement: undefined,
});

const targetEl = useTemplateRef('target');

const placementOptions = [
  'top-start',
  'top-end',
  'bottom-end',
  'bottom-start',
  undefined,
] as const;
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <PlaygroundString v-model="state.subhead" label="subhead" />

      <PlaygroundOptionalBoolean v-model="state.useHover" label="useHover" />

      <PlaygroundOptionalBoolean v-model="state.useClick" label="useClick" />

      <PlaygroundOptionalBoolean v-model="state.show" label="show" />

      <PlaygroundOptionalBoolean v-model="state.disabledTeleport" label="disabledTeleport" />

      <PlaygroundUnion v-model="state.placement" label="placement" :options="placementOptions" />
    </template>

    <template #space>
      <UseDraggable
        ref="target"
        class="target"
        :initial-value="{
          x: 100,
          y: 100,
        }"
      >
        Target element<br />
        Drag me for change position!
      </UseDraggable>

      <MDRichTooltip
        :target-element="targetEl"
        :subhead="state.subhead"
        :use-hover="state.useHover"
        :use-click="state.useClick"
        :disabled-teleport="state.disabledTeleport"
        :show="state.show"
        :placement="state.placement"
      >
        <template #text>
          text text text text text text <br />
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

.target {
  position: fixed;
  display: block;
  background: skyblue;
  padding: 20px;
  cursor: move;
  user-select: none;
  transition-duration: 0;
}
</style>
