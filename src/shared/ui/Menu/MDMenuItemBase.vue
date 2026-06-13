<script setup lang="ts">
import { computed, shallowRef, toRefs, useTemplateRef, watchEffect } from 'vue';
import { MDSymbol } from '../Icon';
import { MDListItem } from '../Lists';
import type { MaybeElement } from '@vueuse/core';
import { useInjectFocusRegister } from './focusProvider';
import { findClosestElement } from '@shared/lib/useClosestElement';
import MDMenuBase from './MDMenuBase.vue';

const showSubmenuModel = defineModel<boolean | undefined>('showSubmenu');

const props = withDefaults(
  defineProps<{
    label: string;
    itemRole?: string | undefined;
    /**
     * name from https://fonts.google.com/icons
     */
    symbolName?: string | undefined;
  }>(),
  {},
);

const emit = defineEmits<{
  click: [];
}>();

const slots = defineSlots<{
  submenu: () => unknown;
}>();

const { label } = toRefs(props);

const listItemEl = useTemplateRef<MaybeElement>('listItemEl');

const showSubmenu = shallowRef(false);

watchEffect(() => {
  showSubmenuModel.value = showSubmenu.value;
});

const onClickItem = () => {
  showSubmenu.value = !showSubmenu.value;
  emit('click');
};

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
    ref="listItemEl"
    mode="single-action"
    :label-text="label"
    class="md-menu-item"
    :role="itemRole ?? null"
    @action="onClickItem"
  >
    <template v-if="symbolName" #leading>
      <MDSymbol :name="symbolName" />
    </template>

    <template v-if="!!slots.submenu" #trailing>
      <MDSymbol name="arrow_right" />
    </template>
  </MDListItem>

  <MDMenuBase
    v-if="slots.submenu"
    v-model:show="showSubmenu"
    :target="listItemEl"
    disabled-teleport
    placement="right-start"
  >
    <slot name="submenu" />
  </MDMenuBase>
</template>
