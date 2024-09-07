<script lang="ts" setup>
import { computed } from 'vue';
import type { DirectoryEntryRef, DirectoryList, FileEntryRef } from './model';
import { TreeList } from '../../shared/ui/TreeMenu';

const props = defineProps<{
  directoryEntry: DirectoryEntryRef;
  activeEntry?: DirectoryEntryRef | FileEntryRef;
}>();

const entityList = computed((): DirectoryList => props.directoryEntry.list);

const activeKey = computed(() => {
  if (props.activeEntry) {
    for (const [key] of entityList.value) {
      return key;
    }
  }
  return undefined;
});

const emit = defineEmits<{
  click: [entry: DirectoryEntryRef | FileEntryRef];
}>();

defineSlots<{
  contextMenu(props: { entry: DirectoryEntryRef | FileEntryRef }): unknown;
}>();

const onClick = (_: string, item: DirectoryEntryRef | FileEntryRef) => {
  emit('click', item);
};
</script>

<template>
  <TreeList :list="entityList" :active-key="activeKey" @click="onClick">
    <template #contextMenu="{ item }">
      <slot name="contextMenu" :entry="item" />
    </template>
  </TreeList>
</template>
