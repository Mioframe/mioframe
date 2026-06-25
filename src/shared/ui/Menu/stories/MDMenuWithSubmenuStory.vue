<script setup lang="ts">
import { ref, useTemplateRef } from 'vue';
import type { MaybeElement } from '@vueuse/core';
import MDMenu from '../MDMenu.vue';
import { MDButton } from '../../Button';
import { defineMenuButtonList } from '../defineMenuButtonList';

const targetEl = useTemplateRef<MaybeElement>('targetEl');
const show = ref(false);

const btns = defineMenuButtonList([
  { key: 'plain', label: 'Plain item' },
  { key: 'iconed', label: 'Iconed item', symbolName: 'star' },
  {
    key: 'with-submenu',
    label: 'Has submenu',
    submenu: [
      { key: 'sub-one', label: 'Submenu one' },
      { key: 'sub-two', label: 'Submenu two' },
    ],
  },
]);

const onToggle = () => {
  show.value = !show.value;
};
</script>

<template>
  <div>
    <MDButton ref="targetEl" label="Open menu" @click="onToggle" />
    <MDMenu v-model:show="show" :target="targetEl" :btns="btns" aria-label="Story menu" />
  </div>
</template>
