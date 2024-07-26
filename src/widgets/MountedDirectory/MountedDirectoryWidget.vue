<script setup lang="ts">
import { shallowRef } from 'vue';
import type { DirectoryEntry, Entry } from '../../entities/entry';
import { EntryList } from '../../entities/entry';
import { CreateDirectoryForm } from '../../features/createDirectory';
import { ModalCard } from '../../shared/ui/ModalCard';
import { RemoveEntryForm } from '../../features/removeEntry';

defineProps<{
  entry: DirectoryEntry;
}>();

const entryForAddingDirectory = shallowRef<DirectoryEntry>();

const onClickAddDirectory = (directoryHandle: DirectoryEntry) => {
  entryForAddingDirectory.value = directoryHandle;
};

const onCancelCreateDirectory = () => {
  entryForAddingDirectory.value = undefined;
};

const onCreateDirectory = () => {
  entryForAddingDirectory.value = undefined;
};

const entryToBeRemoved = shallowRef<Entry>();

const onRemoved = () => {
  entryToBeRemoved.value = undefined;
};

const onCancelRemoved = onRemoved;

const onRemove = (entry: Entry) => {
  entryToBeRemoved.value = entry;
};
</script>

<template>
  <p class="menu-label">{{ entry.name }}</p>

  <EntryList :directory-entry="entry">
    <template #contextMenu="{ entry: entryMenu }">
      <span class="dropdown-item">
        {{ entryMenu.name }}
      </span>

      <button
        v-if="'createDirectory' in entryMenu"
        type="button"
        class="dropdown-item"
        @click="onClickAddDirectory(entryMenu)"
      >
        add Directory
      </button>

      <button type="button" class="dropdown-item" @click="onRemove(entryMenu)">
        remove
      </button>
    </template>
  </EntryList>

  <ModalCard v-if="entryForAddingDirectory">
    <CreateDirectoryForm
      :parent-entry="entryForAddingDirectory"
      @cancel="onCancelCreateDirectory"
      @created="onCreateDirectory"
    />
  </ModalCard>

  <ModalCard v-if="entryToBeRemoved">
    <RemoveEntryForm
      :entry="entryToBeRemoved"
      @cancel="onCancelRemoved"
      @removed="onRemoved"
    />
  </ModalCard>
</template>
