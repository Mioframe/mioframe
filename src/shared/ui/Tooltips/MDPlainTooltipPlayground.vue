<script setup lang="ts">
import { PlaygroundStory, PlaygroundUnion } from '@shared/lib/playground';
import MDPlainTooltip from './MDPlainTooltip.vue';
import { useQueryValue } from '@shared/lib/useQueryState';
import type { ComponentProps } from 'vue-component-type-helpers';
import { useTemplateRef } from 'vue';
import { UseDraggable } from '@vueuse/components';

interface State extends ComponentProps<typeof MDPlainTooltip> {}

const state = useQueryValue<State>('state', {
  text: 'text',
  disabledTeleport: undefined,
  placement: undefined,
});

const target = useTemplateRef('target');

const placementOptions: State['placement'][] = [
  undefined,
  'top',
  'right',
  'bottom',
  'left',
];
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <label>
        subhead
        <input v-model="state.text" type="text" />
      </label>

      <label>
        disabledTeleport
        <input v-model="state.disabledTeleport" type="checkbox" />
      </label>

      <PlaygroundUnion
        v-model:model-value="state.placement"
        :options="placementOptions"
        label="placement"
      />
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

      <MDPlainTooltip
        :target="target"
        :text="state.text"
        :disabled-teleport="state.disabledTeleport"
        :placement="state.placement"
      />
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
