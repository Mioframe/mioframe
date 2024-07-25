<script setup lang="ts">
import { computed } from 'vue';
import { ref, watchEffect } from 'vue';
import EntityList from './EntryList.vue';
import { ContextMenu } from '../../shared/ui/ContextMenu';
import { onClickOutside } from '@vueuse/core';
import { isFileSystemDirectoryHandle } from '../../shared/lib/typeGuards';
import type { DirectoryEntry, FileEntry } from './model';

const props = defineProps<{
  entry: FileEntry | DirectoryEntry;
  opened?: boolean;
}>();

const emit = defineEmits<{
  'update:opened': [opened: boolean];
  click: [FileEntry | DirectoryEntry];
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

const onClickEntity = (fsHandle: FileEntry | DirectoryEntry) => {
  emit('click', fsHandle);
};

const contextMenuPosition = ref<{ x: number; y: number }>();

const refIgnoreContextMenu = ref<HTMLElement>();

onClickOutside(refIgnoreContextMenu, () => {
  contextMenuPosition.value = undefined;
});

const onContextMenu = ({ clientX, clientY }: MouseEvent) => {
  contextMenuPosition.value = {
    x: clientX,
    y: clientY,
  };
};

defineSlots<{
  contextMenu(props: { entry: FileEntry | DirectoryEntry }): unknown;
}>();
</script>

<template>
  <li>
    <div class="buttons has-addons is-flex-wrap-nowrap">
      <button
        type="button"
        class="button is-link is-flex-grow-1"
        :class="{ 'is-active': stateOpened }"
        @click="onClickEntity(entry)"
        @contextmenu.prevent="onContextMenu"
      >
        {{ label }}
      </button>

      <button
        v-if="isFileSystemDirectoryHandle(entry)"
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
      v-if="'getDirectoryList' in entry && stateOpened"
      :directory-entry="entry"
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
