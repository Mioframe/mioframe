<script lang="ts" setup>
import EntityListItem from './EntryListItem.vue';
import type { DirectoryEntry, Entry, FileEntry } from './model';
import { computed } from 'vue';

const props = defineProps<{
  directoryEntry: DirectoryEntry;
  activeEntry?: Entry;
}>();

const entityList = computed(() => props.directoryEntry.list);

const emit = defineEmits<{
  click: [entry: DirectoryEntry | FileEntry];
}>();

defineSlots<{
  contextMenu(props: { entry: DirectoryEntry | FileEntry }): unknown;
}>();
</script>

<template>
  <ul class="menu-list">
    <EntityListItem
      v-for="[name, entry] in entityList"
      :key="name"
      :entry="entry"
      :active-entry="activeEntry"
      @click="emit('click', $event)"
    >
      <template #contextMenu="{ entry: contextEntry }">
        <slot name="contextMenu" :entry="contextEntry" />
      </template>
    </EntityListItem>
  </ul>
</template>

<style lang="scss" scoped>
.menu-list {
  --bulma-menu-nested-list-margin: 0.75em 0 0.75em 0.75em;
}
</style>
