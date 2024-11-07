<script
  lang="ts"
  setup
  generic="
    O extends object,
    K extends string | number,
    T extends AsyncMap<K, T> | O
  "
>
import { computed, ref, watchEffect } from 'vue';
import { ContextMenu } from '../ContextMenu';
import { createLogger } from '../../lib/logger';
import { onInteractionOutside } from '../../lib/onInteractionOutside';
import type { MaybeElement } from '@vueuse/core';
import { type AsyncMap } from './useAsyncMap';
import TreeMap from './TreeMap.vue';
import { ButtonGroup } from '../ButtonGroup';

const { debug } = createLogger('TreeItem');

const props = defineProps<{
  item: T;
  itemKey: K;
  opened?: boolean;
  activeKey?: K;
  activeItem?: T;
  filter?: (v: [K, T]) => boolean;
}>();

const emit = defineEmits<{
  'update:opened': [opened: boolean];
  click: [key: K, item: T];
}>();

const stateOpened = ref<boolean>();

const hasSubList = computed(() => 'get' in props.item);

watchEffect(() => {
  stateOpened.value = hasSubList.value ? props.opened : undefined;
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
  debug('onContextMenu', contextMenuPosition.value);
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
      <button
        v-if="hasSubList"
        class="button"
        :class="{ 'is-active': stateOpened }"
        type="button"
        @click="toggleOpened"
      >
        <span class="icon">
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
        </span>
      </button>

      <button
        type="button"
        class="button is-flex-grow-1"
        :class="{ 'is-active': activeKey === itemKey || activeItem === item }"
        @click="onClickItem(itemKey, item)"
      >
        <span v-if="!hasSubList" class="icon">
          <slot
            :key="itemKey"
            name="icon"
            :item
            :list-open="stateOpened"
            :loading
          >
            <i class="fa-solid fa-minus fa-xs" />
          </slot>
        </span>

        <span :class="{ 'ml-3': !hasSubList }">
          <slot
            :key="itemKey"
            name="label"
            :item
            :list-open="stateOpened"
            :loading
          />
        </span>
      </button>

      <button
        v-if="!!slots.contextMenu"
        ref="refContextMenuButton"
        class="button"
        type="button"
        @click="onContextMenu"
      >
        <i class="fa-solid fa-ellipsis-vertical" />
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

    <TreeMap
      v-if="'get' in item && stateOpened"
      v-model:loading="loading"
      :map="item"
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
    </TreeMap>
  </li>
</template>

<style lang="scss" scoped>
.button {
  width: auto;
  white-space: initial;
}
</style>
