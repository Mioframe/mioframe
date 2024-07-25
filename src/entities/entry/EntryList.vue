<script lang="ts" setup>
import { watchEffect } from 'vue';
import { ref } from 'vue';
import EntityListItem from './EntryListItem.vue';
import type { DirectoryEntry, FileEntry } from './model';

const props = defineProps<{
  directoryEntry: DirectoryEntry;
}>();

const entityList = ref<Map<string, DirectoryEntry | FileEntry>>(new Map());

const updateEntityList = async (directoryEntry: DirectoryEntry) => {
  entityList.value = await directoryEntry.getDirectoryList();
};

watchEffect(() => {
  void updateEntityList(props.directoryEntry);
});

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
      @click="emit('click', entry)"
    >
      <template #contextMenu>
        <slot name="contextMenu" :entry />
      </template>
    </EntityListItem>
  </ul>
</template>

<style lang="scss" scoped>
.menu-list {
  --bulma-menu-nested-list-margin: 0.75em 0 0.75em 0.75em;
}
</style>
