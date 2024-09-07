<script
  lang="ts"
  setup
  generic="
    K extends string | number,
    T extends {
      label: string;
      list?: {
        [Symbol.iterator](): IterableIterator<[K, T]>;
      };
    }
  "
>
import TreeItem from './TreeItem.vue';

defineProps<{
  list: {
    [Symbol.iterator](): IterableIterator<[K, T]>;
  };
  activeKey?: K;
}>();

const emit = defineEmits<{
  click: [key: K, item: T];
}>();

defineSlots<{
  contextMenu(props: { key: K; item: T }): unknown;
}>();

const onClick = (key: K, item: T) => {
  emit('click', key, item);
};
</script>

<template>
  <ul class="menu-list">
    <TreeItem
      v-for="[key, item] in list"
      :key="key"
      :item-key="key"
      :item="item"
      :active-key="activeKey"
      @click="onClick"
    >
      <template #contextMenu="{ item: contextItem, key: contextKey }">
        <slot :key="contextKey" name="contextMenu" :item="contextItem" />
      </template>
    </TreeItem>
  </ul>
</template>

<style lang="scss" scoped>
.menu-list {
  --bulma-menu-nested-list-margin: 0.75em 0 0.75em 0.75em;
}
</style>
