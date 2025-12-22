<script setup lang="ts" generic="T extends MenuButtonDescription<T>">
import { computed, ref, useTemplateRef, watchEffect } from 'vue';
import { MDSymbol } from '../Icon';
import { MDListItem } from '../Lists';
import MDMenu from './MDMenu.vue';
import type { MenuButtonDescription } from './types';
import type { MaybeElement } from '@vueuse/core';
import { useInjectFocusRegister } from './focusProvider';
import { findClosestElement } from '@shared/lib/useClosestElement';

const props = withDefaults(
  defineProps<{
    item: T;
    role?: string;
  }>(),
  {
    role: 'menuitem',
  },
);

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

const label = computed(() => props.item.label);

const htmlEl = computed(() =>
  listItemEl.value ? findClosestElement(listItemEl.value) : undefined,
);

const focus = computed(() =>
  htmlEl.value
    ? () => {
        htmlEl.value?.focus();
      }
    : undefined,
);

useInjectFocusRegister(label, focus);
</script>

<template>
  <MDListItem
    is="button"
    ref="listItemEl"
    :headline="item.label"
    type="button"
    class="md-menu-item"
    :role="role"
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
    v-model:show="showSubmenu"
    :btns="item.submenu"
    :target="listItemEl"
    disabled-teleport
    placement="right-start"
    @click="emit('click', $event)"
  />
</template>
