<script setup lang="ts" generic="T extends MenuButtonDescription<T>">
import { MDIconButton } from '@shared/ui/Button';
import type { MaybeElement } from '@vueuse/core';
import { nextTick, ref, useTemplateRef } from 'vue';
import type { MenuButtonDescription, MenuButtonList } from './types';
import MDMenu from './MDMenu.vue';
import { sessionUniqueId } from '@shared/lib/uniqueId';

const { btns, tooltip = 'options' } = defineProps<{
  btns: MenuButtonList<T>;
  tooltip?: string;
  size?: 'extra-small' | 'small' | 'medium' | 'large' | 'extra-large' | undefined;
  width?: 'default' | 'narrow' | 'wide' | undefined;
}>();

const showMenu = ref(false);

const targetBtn = useTemplateRef<MaybeElement>('targetBtn');

const onClickTarget = () => {
  showMenu.value = !showMenu.value;
};

const emit = defineEmits<{
  click: [item: T];
}>();

const onClick = async (item: T) => {
  showMenu.value = false;
  await nextTick();
  emit('click', item);
};

const onClickOutsideMenu = () => {
  showMenu.value = false;
};

const idMenu = sessionUniqueId('menu');
</script>

<template>
  <MDIconButton
    ref="targetBtn"
    :size="size"
    :tooltip="tooltip"
    :width="width"
    md-symbol-name="more_vert"
    aria-haspopup="menu"
    :aria-expanded="showMenu ? 'true' : 'false'"
    :aria-controls="idMenu"
    @click="onClickTarget"
  />

  <MDMenu
    v-if="btns.length"
    v-model:show="showMenu"
    :target="targetBtn"
    :btns="btns"
    :aria-label="`${tooltip} menu`"
    @interaction-outside="onClickOutsideMenu"
    @click="onClick"
    @deactivate-focus="showMenu = false"
  />
</template>
