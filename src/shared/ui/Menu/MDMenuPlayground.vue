<script setup lang="ts">
import { PlaygroundStory } from '@shared/lib/playground';
import MDMenu from './MDMenu.vue';
import { MDButton } from '../Button';
import { ref, useTemplateRef } from 'vue';
import type { MaybeElement } from '@vueuse/core';
import { faker } from '@faker-js/faker';
import { defineMenuButtonList } from './defineMenuButtonList';
import type { MenuButtonDescription } from './types';
import { sessionUniqueId } from '@shared/lib/uniqueId';

const targetEl = useTemplateRef<MaybeElement>('targetEl');

const state = ref({ show: false });

const generateBtn = () => {
  const label = faker.lorem.words({ min: 1, max: 3 });
  return {
    label,
    symbolName: faker.helpers.maybe(() => 'star'),
    key: sessionUniqueId(''),
  };
};

const btns = defineMenuButtonList([
  generateBtn(),
  {
    ...generateBtn(),
    key: 1,
    submenu: [
      generateBtn(),
      {
        ...generateBtn(),
        key: 2,
        submenu: [generateBtn(), generateBtn(), generateBtn()],
      },
      generateBtn(),
      generateBtn(),
    ],
  },
  generateBtn(),
  generateBtn(),
  generateBtn(),
  generateBtn(),
  generateBtn(),
]);

const onClick = (item: MenuButtonDescription) => {
  // eslint-disable-next-line no-console -- playground debug logging
  console.log('onClick', item);
};
</script>

<template>
  <PlaygroundStory>
    <template #controllers />

    <template #space>
      <MDButton ref="targetEl" label="target" @click="state.show = !state.show" />

      <MDMenu v-model:show="state.show" :target="targetEl" :btns="btns" @click="onClick" />
    </template>
  </PlaygroundStory>
</template>
