<script setup lang="ts">
import { EntryList } from '../../entities/entry';
// import { isFileSystemDirectoryHandle } from '../../shared/lib/typeGuards';

defineProps<{
  handle: FileSystemDirectoryHandle;
}>();

const onCLickEntry = (
  fsHandle: FileSystemDirectoryHandle | FileSystemFileHandle,
) => {
  console.log(fsHandle.name);
};

// const onClickAddDirectory = async (
//   directoryHandle: FileSystemDirectoryHandle,
// ) => {
//   await directoryHandle.getDirectoryHandle('test', { create: true });
// };

// todo: добавить окно с ввода названия папки
</script>

<template>
  <p class="menu-label">{{ handle.name }}</p>

  <EntryList :directory-handle="handle" @click="onCLickEntry">
    <!--
      <template #contextMenu="{ handle: handleMenu }">
      <button
      v-if="isFileSystemDirectoryHandle(handleMenu)"
      type="button"
      class="dropdown-item"
      @click="onClickAddDirectory(handleMenu)"
      >
      add Directory
      </button>
      </template> 
    -->
  </EntryList>
</template>
