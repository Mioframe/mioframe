<script setup lang="ts">
import { shallowRef } from 'vue';
import type { DirectoryEntry } from '../../entities/entry';
import { EntryList } from '../../entities/entry';
import { CreateDirectoryForm } from '../../features/createDirectory';
import { isFileSystemDirectoryHandle } from '../../shared/lib/typeGuards';
import { ModalCard } from '../../shared/ui/ModalCard';

defineProps<{
  entry: DirectoryEntry;
}>();

const handleToCreateDirectory = shallowRef<FileSystemDirectoryHandle>();

const onClickAddDirectory = (directoryHandle: FileSystemDirectoryHandle) => {
  handleToCreateDirectory.value = directoryHandle;
};

const onCancelCreateDirectory = () => {
  handleToCreateDirectory.value = undefined;
};

const onCreateDirectory = () => {
  handleToCreateDirectory.value = undefined;
};
</script>

<template>
  <p class="menu-label">{{ entry.name }}</p>

  <EntryList :directory-entry="entry">
    <template #contextMenu="{ entry: handleMenu }">
      <button
        v-if="isFileSystemDirectoryHandle(handleMenu)"
        type="button"
        class="dropdown-item"
        @click="onClickAddDirectory(handleMenu)"
      >
        add Directory
      </button>

      <!-- todo: для удаления понадобится изменённая модель entry -->
      <button type="button" class="dropdown-item">delete</button>
    </template>
  </EntryList>

  <ModalCard v-if="handleToCreateDirectory">
    <CreateDirectoryForm
      :parent-handle="handleToCreateDirectory"
      @cancel="onCancelCreateDirectory"
      @created="onCreateDirectory"
    />
  </ModalCard>
</template>
