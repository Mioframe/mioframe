<script setup lang="ts">
import { PlaygroundStory } from '@shared/lib/playground';
import MDMenu from './MDMenu.vue';
import { MDButton } from '../Button';
import { useTemplateRef } from 'vue';
import type { MaybeElement } from '@vueuse/core';
import { useQueryValue } from '@shared/lib/useQueryState';

const targetEl = useTemplateRef<MaybeElement>('targetEl');

const state = useQueryValue('state', { show: false });

const btns = new Array(10).fill(0).map((_, index) => ({
  label: `button ${index}`,
  symbolName: index === 1 ? 'star' : undefined,
  key: index,
}));
</script>

<template>
  <PlaygroundStory>
    <template #controllers />

    <template #space>
      <MDButton
        ref="targetEl"
        label="target"
        @click="state.show = !state.show"
      />

      <MDMenu v-model:show="state.show" :target="targetEl" :btns="btns" />
    </template>
  </PlaygroundStory>
</template>
