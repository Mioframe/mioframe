<script setup lang="ts" generic="T extends MenuButtonDescription<T>">
import { ref, useTemplateRef, watchEffect } from 'vue';
import { MDSymbol } from '../Icon';
import { MDListItem } from '../Lists';
import MDMenu from './MDMenu.vue';
import type { MenuButtonDescription } from './types';
import type { MaybeElement } from '@vueuse/core';

const props = defineProps<{
  item: T;
}>();

const emit = defineEmits<{
  click: [T];
}>();

const showSubmenuModel = defineModel<boolean>('showSubmenu');

const listItemEl = useTemplateRef<MaybeElement>('listItemEl');

const showSubmenu = ref(false);

watchEffect(() => {
  showSubmenuModel.value = showSubmenu.value;
});

const onClickItem = () => {
  if (props.item.submenu) {
    showSubmenu.value = !showSubmenu.value;
  }
  emit('click', props.item);
};
</script>

<template>
  <MDListItem
    is="button"
    ref="listItemEl"
    :headline="item.label"
    type="button"
    class="md-menu-item"
    @click="onClickItem"
  >
    <template v-if="item.symbolName" #leadingIcon>
      <MDSymbol :name="item.symbolName" />
    </template>

    <template v-if="item.submenu?.length" #trailingIcon>
      <MDSymbol name="arrow_right" />
    </template>
  </MDListItem>

  <MDMenu
    v-if="item.submenu?.length"
    :id="item.key"
    v-model:show="showSubmenu"
    :btns="item.submenu"
    :target="listItemEl"
    disabled-teleport
    placement="right-start"
    @click="emit('click', $event)"
  />
</template>
