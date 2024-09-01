<script setup lang="ts">
import { computed } from 'vue';
import { ref, watchEffect } from 'vue';
import EntityList from './EntryList.vue';
import { ContextMenu } from '../../shared/ui/ContextMenu';
import { onClickOutside } from '@vueuse/core';
import type { DirectoryEntryRef, EntryRef, FileEntryRef } from './model';

const props = defineProps<{
  entry: FileEntryRef | DirectoryEntryRef;
  opened?: boolean;
  activeEntry?: EntryRef;
}>();

const emit = defineEmits<{
  'update:opened': [opened: boolean];
  click: [FileEntryRef | DirectoryEntryRef];
}>();

const stateOpened = ref<boolean>(false);

watchEffect(() => {
  stateOpened.value = props.opened;
});

const toggleOpened = () => {
  stateOpened.value = !stateOpened.value;
  emit('update:opened', stateOpened.value);
};

const label = computed(() => props.entry.name);

const onClickEntity = (fsHandle: FileEntryRef | DirectoryEntryRef) => {
  emit('click', fsHandle);
};

const contextMenuPosition = ref<{ clientX: number; clientY: number }>();

const refIgnoreContextMenu = ref<HTMLElement>();

onClickOutside(refIgnoreContextMenu, () => {
  contextMenuPosition.value = undefined;
});

const onContextMenu = ({ clientX, clientY }: MouseEvent) => {
  contextMenuPosition.value = {
    clientX,
    clientY,
  };
};

defineSlots<{
  contextMenu(props: { entry: FileEntryRef | DirectoryEntryRef }): unknown;
}>();
</script>

<template>
  <li>
    <div class="buttons has-addons is-flex-wrap-nowrap">
      <button
        type="button"
        class="button is-link is-flex-grow-1"
        :class="{ 'is-active': activeEntry === entry }"
        @click="onClickEntity(entry)"
        @contextmenu.prevent="onContextMenu"
      >
        {{ label }}
      </button>

      <button
        v-if="'list' in entry"
        class="button is-link"
        :class="{ 'is-active': stateOpened }"
        type="button"
        @click="toggleOpened"
      >
        <i
          class="fa-solid fa-caret-down"
          :class="{ 'fa-flip-vertical': stateOpened }"
        />
      </button>
    </div>

    <ContextMenu
      v-if="contextMenuPosition"
      ref="refIgnoreContextMenu"
      :origin-position="contextMenuPosition"
    >
      <slot name="contextMenu" :entry="entry" />
    </ContextMenu>

    <EntityList
      v-if="'list' in entry && stateOpened"
      :directory-entry="entry"
      :active-entry="activeEntry"
      @click="emit('click', $event)"
    >
      <template #contextMenu="{ entry: contextEntry }">
        <slot name="contextMenu" :entry="contextEntry" />
      </template>
    </EntityList>
  </li>
</template>

<style lang="scss" scoped>
.button {
  width: auto;
}
</style>
