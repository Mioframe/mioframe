<script lang="ts" setup generic="E extends string | number = string | number">
import { ref } from 'vue';
import ContextMenu from '../ContextMenu/ContextMenu.vue';
import type { MaybeElement } from '@vueuse/core';
import { onInteractionOutside } from '../../lib/onInteractionOutside';

export interface MenuItem<E extends string | number = string | number> {
  label: string;
  eventName: E;
}

defineProps<{
  title?: string;
  menu: MenuItem<E>[];
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
    class="button"
    :class="$attrs.class"
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
      class="dropdown-item is-flex is-align-items-center"
      @click="emit('click', eventName)"
    >
      <span class="icon is-small">
        <!-- eslint-disable-next-line vue/require-explicit-slots -->
        <slot :name="eventName"> <i class="fa-solid fa-circle" /> </slot>
      </span>

      <span class="ml-2">{{ label }}</span>
    </button>
  </ContextMenu>
</template>
