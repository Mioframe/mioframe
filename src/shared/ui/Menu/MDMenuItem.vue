<script setup lang="ts" generic="T extends MenuButtonDescription<T>">
import type { MenuButtonDescription } from './types';
import MDMenuItemBase from './MDMenuItemBase.vue';

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

const onClickItem = (subItem?: T) => {
  emit('click', subItem ?? props.item);
};
</script>

<template>
  <MDMenuItemBase
    :label="item.label"
    :symbol-name="item.symbolName"
    :role="role"
    @click="onClickItem"
  >
    <template v-if="item.submenu?.length" #submenu>
      <MDMenuItem
        v-for="v in item.submenu"
        :key="v.label"
        :item="v"
        :role="role"
        @click="onClickItem($event)"
      />
    </template>
  </MDMenuItemBase>
</template>
