<script
  lang="ts"
  setup
  generic="
    Key extends string | number,
    Item extends Partial<{} | ItemWithChildren<Key, Item>>
  "
>
import { computed, ref, watchEffect } from 'vue';
import { ContextMenu } from '../ContextMenu';
import { onInteractionOutside } from '../../lib/onInteractionOutside';
import type { MaybeElement } from '@vueuse/core';
import { ButtonGroup } from '../ButtonGroup';
import type { IterableCollection } from './useIterable';
import { isItemWithChildren, type ItemWithChildren } from './useIterable';
import TreeIterable from './TreeIterable.vue';
import { UIButton } from '../Button';

const props = defineProps<{
  itemKey: Key;
  item: Item;
  activeKey?: Key;
  activeItem?: Item;
  opened?: boolean;
  filter?: (v: [Key, Item]) => boolean;
}>();

const emit = defineEmits<{
  'update:opened': [opened: boolean];
  click: [key: Key, item: Item];
}>();

const stateOpened = ref<boolean>();

const children = computed((): IterableCollection<Key, Item> | undefined => {
  const item = props.item;
  if (isItemWithChildren<typeof item, Key, Item>(item)) {
    return item.children;
  }
  return undefined;
});

const hasSubCollection = computed(() => children.value);

watchEffect(() => {
  stateOpened.value = hasSubCollection.value ? props.opened : undefined;
});

const toggleOpened = () => {
  stateOpened.value = !stateOpened.value;
  emit('update:opened', stateOpened.value);
};

const onClickItem = (key: Key, item: Item) => {
  emit('click', key, item);
};

const contextMenuPosition = ref<{ clientX: number; clientY: number }>();

const refContextMenu = ref<MaybeElement>();
const refContextMenuButton = ref<MaybeElement>();

onInteractionOutside(
  refContextMenu,
  () => {
    contextMenuPosition.value = undefined;
  },
  {
    ignore: [refContextMenuButton],
  },
);

const onContextMenu = ({ clientX, clientY }: MouseEvent) => {
  contextMenuPosition.value = contextMenuPosition.value
    ? undefined
    : {
        clientX,
        clientY,
      };
};

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
  item(props: {
    key: Key;
    item: Item;
    listOpen?: boolean;
    loading?: boolean;
    activeItem?: Item;
  }): unknown;
}>();

const loading = ref<boolean>();
</script>

<template>
  <li>
    <ButtonGroup>
      <UIButton
        v-if="hasSubCollection"
        :active="stateOpened"
        @click="toggleOpened"
      >
        <template #icon>
          <slot
            :key="itemKey"
            name="icon"
            :item
            :list-open="stateOpened"
            :loading
          >
            <i
              class="fa-solid fa-caret-down"
              :class="{ 'fa-flip-vertical': stateOpened }"
            />
          </slot>
        </template>
      </UIButton>

      <slot
        :key="itemKey"
        name="item"
        :item
        :active-item
        :list-open="stateOpened"
        :loading
      />

      <button
        v-if="!!slots.contextMenu"
        ref="refContextMenuButton"
        class="button"
        type="button"
        @click="onContextMenu"
      >
        <span class="icon">
          <i class="fa-solid fa-ellipsis-vertical" />
        </span>
      </button>
    </ButtonGroup>

    <ContextMenu
      v-if="contextMenuPosition"
      v-model:ref-dropdown="refContextMenu"
      :origin-position="contextMenuPosition"
    >
      <slot
        :key="itemKey"
        name="contextMenu"
        :item="item"
        :list-open="stateOpened"
        :loading
      />
    </ContextMenu>

    <TreeIterable
      v-if="children && stateOpened"
      v-model:loading="loading"
      :collection="children"
      :active-key
      :active-item
      :filter
      @click="onClickItem"
    >
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
    </TreeIterable>
  </li>
</template>

<style lang="scss" scoped>
.button {
  width: auto;
  white-space: initial;
}
</style>
