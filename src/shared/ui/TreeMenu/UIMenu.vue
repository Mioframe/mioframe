<script
  setup
  lang="ts"
  generic="
    Key extends string | number,
    Item extends
      | {
          children: IterableCollection<Key, Item>;
        }
      | object
  "
>
import TreeIterable from './TreeIterable.vue';
import type { IterableCollection } from './useIterable';

defineProps<{
  collection?: IterableCollection<Key, Item>;
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

const onLoading = (loading: boolean) => {
  emit('update:loading', loading);
};
</script>

<template>
  <section class="menu">
    <TreeIterable
      :collection
      :active-item
      :active-key
      :filter
      @click="onClick"
      @update:loading="onLoading"
    >
      <template v-if="!!slots.item" #item="scopeItem">
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

      <template v-if="!!slots.after" #after>
        <slot name="after" />
      </template>
    </TreeIterable>
  </section>
</template>
