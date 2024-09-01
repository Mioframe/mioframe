<script lang="ts" setup>
import EntityListItem from './EntryListItem.vue';
import { computed } from 'vue';
import type { DirectoryEntryRef, EntryRef, FileEntryRef } from './model';

const props = defineProps<{
  directoryEntry: DirectoryEntryRef;
  activeEntry?: EntryRef;
}>();

const entityList = computed(() => props.directoryEntry.list);

const emit = defineEmits<{
  click: [entry: DirectoryEntryRef | FileEntryRef];
}>();

defineSlots<{
  contextMenu(props: { entry: DirectoryEntryRef | FileEntryRef }): unknown;
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
