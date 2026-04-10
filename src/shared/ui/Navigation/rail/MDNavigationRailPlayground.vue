<script setup lang="ts">
import {
  PlaygroundOptionalBoolean,
  PlaygroundStory,
  PlaygroundUnion,
} from '@shared/lib/playground';
import MDNavigationRail from './MDNavigationRail.vue';
import { shallowRef } from 'vue';
import { useQueryValue } from '@shared/lib/useQueryState';
import type { NavigationButton } from '../types';
import { defineNavigationButtonList } from '../types';
import { RAIL_TYPE } from './types';

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

const state = useQueryValue<{ type?: RAIL_TYPE | undefined; hasMenu?: boolean | undefined }>(
  'state',
  {
    type: RAIL_TYPE.collapsed,
    hasMenu: undefined,
  },
);

const railTypeOptions = [RAIL_TYPE.collapsed, RAIL_TYPE.expanded, undefined] as const;
</script>

<template>
  <PlaygroundStory>
    <template #controllers>
      <PlaygroundUnion v-model="state.type" label="type" :options="railTypeOptions" />

      <PlaygroundOptionalBoolean v-model="state.hasMenu" label="hasMenu" />
    </template>

    <template #space>
      <MDNavigationRail
        :buttons="buttons"
        :active="active"
        :type="state.type"
        :has-menu="state.hasMenu"
        @click="onClick"
      />
    </template>
  </PlaygroundStory>
</template>
