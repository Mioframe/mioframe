<script
  lang="ts"
  setup
  generic="
    Key extends string | number,
    Item extends
      | {
          children: IterableCollection<Key, Item>;
        }
      | object
  "
>
import { toRef, watchEffect } from 'vue';
import type { IterableCollection } from './useIterable';
import { useIterable } from './useIterable';
import TreeIterableItem from './TreeIterableItem.vue';

const props = defineProps<{
  collection: IterableCollection<Key, Item>;
  activeKey?: Key;
  activeItem?: Item;
  filter?: (v: [Key, Item]) => boolean;
}>();

const emit = defineEmits<{
  click: [key: Key, item: Item];
  'update:loading': [loading: boolean];
}>();

const slots = defineSlots<{
  contextMenu(props: {
    key: Key;
    item: Item;
    listOpen?: boolean;
    loading?: boolean;
  }): unknown;
  icon(props: {
    key: Key;
    item: Item;
    listOpen?: boolean;
    loading?: boolean;
  }): unknown;
  after(): unknown;
  item(props: {
    key: Key;
    item: Item;
    listOpen?: boolean;
    loading?: boolean;
    activeItem?: Item;
  }): unknown;
}>();

const onClick = (key: Key, item: Item) => {
  emit('click', key, item);
};

const { collection: collectionRef, loading: loadingIterable } = useIterable<
  [Key, Item]
>(
  toRef(() => props.collection),
  toRef(() => props.filter),
);

watchEffect(() => {
  emit('update:loading', loadingIterable.value);
});

const activeKey2 = toRef(() => props.activeKey);
</script>

<template>
  <ul class="menu-list">
    <TreeIterableItem
      v-for="[key, item] in collectionRef"
      :key="key"
      :item-key="key"
      :item="item"
      :active-key="activeKey2"
      :active-item
      :filter
      @click="onClick"
    >
      <template #item="scopeItem">
        <slot name="item" v-bind="scopeItem" />
      </template>

      <template v-if="!!slots.contextMenu" #contextMenu="scoped">
        <slot
          :key="scoped.key"
          name="contextMenu"
          :item="scoped.item"
          :list-open="scoped.listOpen"
          :loading="scoped.loading"
        />
      </template>

      <template v-if="!!slots.icon" #icon="scoped">
        <slot
          :key="scoped.key"
          name="icon"
          :item="scoped.item"
          :list-open="scoped.listOpen"
          :loading="scoped.loading"
        />
      </template>
    </TreeIterableItem>

    <slot name="after" />
  </ul>
</template>

<style lang="scss" scoped>
.menu-list {
  --bulma-menu-nested-list-margin: 0.75em 0 0.75em 0.75em;
}
</style>
