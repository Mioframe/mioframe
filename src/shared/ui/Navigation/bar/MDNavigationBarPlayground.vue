<script setup lang="ts">
import { PlaygroundStory, PlaygroundUnion } from '@shared/lib/playground';
import MDNavigationBar from './MDNavigationBar.vue';

import { shallowRef } from 'vue';
import { useQueryValue } from '@shared/lib/useQueryState';
import { BAR_TYPE } from './types';
import type { NavigationButton } from '../types';
import { defineNavigationButtonList } from '../types';

const buttons = defineNavigationButtonList(
  {
    label: 'Label',
    symbol: 'star',
  },
  {
    label: 'Label 22',
    symbol: 'search',
  },
  {
    label: 'Label 333',
    symbol: 'home',
  },
  {
    label: 'Label 4444',
    symbol: 'settings',
  },
);

const active = shallowRef<NavigationButton>();

const onClick = (v: NavigationButton) => {
  active.value = v;
};

const state = useQueryValue<{ type?: BAR_TYPE | undefined }>('state', {
  type: undefined,
});

const typeOptions = [BAR_TYPE.vertical, BAR_TYPE.horizontal, undefined] as const;
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <PlaygroundUnion v-model="state.type" label="type" :options="typeOptions" />
    </template>

    <template #space>
      <MDNavigationBar :buttons="buttons" :active="active" :type="state.type" @click="onClick" />
    </template>
  </PlaygroundStory>
</template>
