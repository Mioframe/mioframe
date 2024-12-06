<script
  lang="ts"
  setup
  generic="
    K extends string | number,
    T extends
      | {
          children: IterableCollection<K, T>;
        }
      | object
  "
>
import { toRef, watchEffect } from 'vue';
import type { IterableCollection } from './useIterable';
import { useIterable } from './useIterable';
import TreeIterableItem from './TreeIterableItem.vue';
import { createLogger } from '@shared/lib/logger';

const props = defineProps<{
  collection: IterableCollection<K, T>;
  activeKey?: K;
  activeItem?: T;
  filter?: (v: [K, T]) => boolean;
}>();

const emit = defineEmits<{
  click: [key: K, item: T];
  'update:loading': [loading: boolean];
}>();

const slots = defineSlots<{
  contextMenu(props: {
    key: K;
    item: T;
    listOpen?: boolean;
    loading?: boolean;
  }): unknown;
  label(props: {
    key: K;
    item: T;
    listOpen?: boolean;
    loading?: boolean;
  }): unknown;
  icon(props: {
    key: K;
    item: T;
    listOpen?: boolean;
    loading?: boolean;
  }): unknown;
  after(): unknown;
}>();

const onClick = (key: K, item: T) => {
  emit('click', key, item);
};

const { debug } = createLogger('TreeIterable');

watchEffect(() => {
  debug('props.collection', props.collection);
});

const { collection: collectionRef, loading: loadingIterable } = useIterable<
  [K, T]
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
      <template #label="scoped">
        <slot
          :key="scoped.key"
          name="label"
          :item="scoped.item"
          :list-open="scoped.listOpen"
          :loading="scoped.loading"
        />
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
