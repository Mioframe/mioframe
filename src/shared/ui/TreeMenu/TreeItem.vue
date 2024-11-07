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
import { computed, ref, watchEffect } from 'vue';
import { ContextMenu } from '../ContextMenu';
import TreeList from './TreeList.vue';
import { createLogger } from '../../lib/logger';
import { onInteractionOutside } from '../../lib/onInteractionOutside';
import type { MaybeElement } from '@vueuse/core';
import { ButtonGroup } from '../ButtonGroup';

const { debug } = createLogger('TreeItem');

const props = defineProps<{
  item: T;
  itemKey: K;
  opened?: boolean;
  activeKey?: K;
}>();

const emit = defineEmits<{
  'update:opened': [opened: boolean];
  click: [key: K, item: T];
}>();

const stateOpened = ref<boolean>(false);

watchEffect(() => {
  stateOpened.value = props.opened;
});

const toggleOpened = () => {
  stateOpened.value = !stateOpened.value;
  emit('update:opened', stateOpened.value);
};

const label = computed(() => props.item.label);

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

defineSlots<{
  contextMenu(props: { key: K; item: T }): unknown;
}>();

const hasSubList = computed(() => 'list' in props.item);
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
        <i
          class="fa-solid fa-caret-down"
          :class="{ 'fa-flip-vertical': stateOpened }"
        />
      </button>

      <button
        type="button"
        class="button is-flex-grow-1 ellipsis"
        :class="{ 'is-active': activeKey === itemKey }"
        @click="onClickItem(itemKey, item)"
      >
        <span v-if="!hasSubList" class="icon">
          <i class="fa-solid fa-minus fa-xs" />
        </span>

        <span :class="{ 'ml-3': !hasSubList }">
          {{ label }}
        </span>
      </button>

      <button
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
      <slot :key="itemKey" name="contextMenu" :item="item" />
    </ContextMenu>

    <TreeList
      v-if="item.list && stateOpened"
      :list="item.list"
      :active-key="activeKey"
      @click="onClickItem"
    >
      <template #contextMenu="{ key: contextKey, item: contextItem }">
        <slot :key="contextKey" name="contextMenu" :item="contextItem" />
      </template>
    </TreeList>
  </li>
</template>

<style lang="scss" scoped>
.button {
  width: auto;
}

.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
