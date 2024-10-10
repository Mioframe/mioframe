<script lang="ts" setup>
import { computed } from 'vue';
import type { LocalDirectoryRef, DirectoryList, LocalFileRef } from './model';
import { TreeList } from '../../shared/ui/TreeMenu';

const props = defineProps<{
  directoryEntry: LocalDirectoryRef;
  activeEntry?: LocalDirectoryRef | LocalFileRef;
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
  click: [entry: LocalDirectoryRef | LocalFileRef];
}>();

defineSlots<{
  contextMenu(props: { entry: LocalDirectoryRef | LocalFileRef }): unknown;
}>();

const onClick = (_: string, item: LocalDirectoryRef | LocalFileRef) => {
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
