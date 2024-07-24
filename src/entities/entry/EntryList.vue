<script lang="ts" setup>
import { watchEffect } from 'vue';
import { ref } from 'vue';
import EntityListItem from './EntryListItem.vue';

const props = defineProps<{
  directoryHandle: FileSystemDirectoryHandle;
}>();

const entityList = ref<
  Map<string, FileSystemDirectoryHandle | FileSystemFileHandle>
>(new Map());

const updateEntityList = async (directoryHandle: FileSystemDirectoryHandle) => {
  entityList.value.clear();
  for await (const [name, handle] of directoryHandle.entries()) {
    entityList.value.set(name, handle);
  }
};

watchEffect(() => {
  void updateEntityList(props.directoryHandle);
});

const emit = defineEmits<{
  click: [fsHandle: FileSystemDirectoryHandle | FileSystemFileHandle];
}>();

defineSlots<{
  contextMenu(props: {
    handle: FileSystemFileHandle | FileSystemDirectoryHandle;
  }): unknown;
}>();
</script>

<template>
  <ul class="menu-list">
    <EntityListItem
      v-for="[name, handle] in entityList"
      :key="name"
      :handle="handle"
      @click="emit('click', handle)"
    >
      <template #contextMenu>
        <slot name="contextMenu" :handle />
      </template>
    </EntityListItem>
  </ul>
</template>

<style lang="scss" scoped>
.menu-list {
  --bulma-menu-nested-list-margin: 0.75em 0 0.75em 0.75em;
}
</style>
