<script lang="ts" setup generic="E extends string">
import { ref } from 'vue';
import ContextMenu from '../ContextMenu/ContextMenu.vue';
import type { MaybeElement } from '@vueuse/core';
import { onInteractionOutside } from '../../lib/onInteractionOutside';

defineProps<{
  title?: string;
  menu: {
    label: string;
    eventName: E;
  }[];
}>();

const emit = defineEmits<{
  click: [eventName: E];
}>();

const refContextMenuButton = ref<MaybeElement>();
const contextMenuPosition = ref<{ clientX: number; clientY: number }>();
const refContextMenu = ref<MaybeElement>();

const onContextMenu = ({ clientX, clientY }: MouseEvent) => {
  contextMenuPosition.value = contextMenuPosition.value
    ? undefined
    : {
        clientX,
        clientY,
      };
};

onInteractionOutside(
  refContextMenu,
  () => {
    contextMenuPosition.value = undefined;
  },
  {
    ignore: [refContextMenuButton],
  },
);

defineSlots<{
  [N in E]: () => unknown;
}>();
</script>

<template>
  <button
    ref="refContextMenuButton"
    class="button is-link"
    type="button"
    @click="onContextMenu"
  >
    <i class="fa-solid fa-ellipsis-vertical" />
  </button>

  <ContextMenu
    v-if="contextMenuPosition"
    v-model:ref-dropdown="refContextMenu"
    :origin-position="contextMenuPosition"
  >
    <template v-if="title">
      <span class="dropdown-item">
        {{ title }}
      </span>

      <hr class="dropdown-divider" />
    </template>

    <button
      v-for="{ eventName, label } in menu"
      :key="eventName"
      type="button"
      class="dropdown-item"
      title="create new directory"
      @click="emit('click', eventName)"
    >
      <span class="icon is-small">
        <slot :name="eventName">
          <i class="fa-solid fa-point" />
        </slot>
      </span>

      <span class="ml-2">{{ label }}</span>
    </button>
  </ContextMenu>
</template>
