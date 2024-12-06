<script
  lang="ts"
  setup
  generic="
    K extends string | number,
    T extends Partial<{} | ItemWithChildren<K, T>>
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
  itemKey: K;
  item: T;
  activeKey?: K;
  activeItem?: T;
  opened?: boolean;
  filter?: (v: [K, T]) => boolean;
}>();

const emit = defineEmits<{
  'update:opened': [opened: boolean];
  click: [key: K, item: T];
}>();

const stateOpened = ref<boolean>();

const children = computed((): IterableCollection<K, T> | undefined => {
  const item = props.item;
  if (isItemWithChildren<typeof item, K, T>(item)) {
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

const onClickItem = (key: K, item: T) => {
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

      <!-- fixme: заменить тело элемента (UIButton) на слот -->
      <UIButton
        grow
        :active="activeKey === itemKey || activeItem === item"
        @click="onClickItem(itemKey, item)"
      >
        <template v-if="!hasSubCollection" #icon>
          <slot
            :key="itemKey"
            name="icon"
            :item
            :list-open="stateOpened"
            :loading
          >
            <i class="fa-solid fa-minus fa-xs" />
          </slot>
        </template>

        <span :class="{ 'ml-3': !hasSubCollection }">
          <slot
            :key="itemKey"
            name="label"
            :item
            :list-open="stateOpened"
            :loading
          />
        </span>
      </UIButton>

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
    </TreeIterable>
  </li>
</template>

<style lang="scss" scoped>
.button {
  width: auto;
  white-space: initial;
}
</style>
