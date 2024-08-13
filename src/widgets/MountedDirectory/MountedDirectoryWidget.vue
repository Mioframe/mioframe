<script setup lang="ts">
import { shallowRef } from 'vue';
import type { DirectoryEntry, Entry, FileEntry } from '../../entities/entry';
import { EntryList } from '../../entities/entry';
import { CreateDirectoryForm } from '../../features/createDirectory';
import { ModalCard } from '../../shared/ui/ModalCard';
import { RemoveEntryForm } from '../../features/removeEntry';
import { AddFileForm } from '../../features/addFile';
import { MoveEntryForm } from '../../features/moveEntry';

defineProps<{
  entry: DirectoryEntry;
}>();

defineSlots<{
  buttonAddons: () => unknown;
}>();

const entryForAddingDirectory = shallowRef<DirectoryEntry>();

const onClickCreateDirectory = (directoryHandle: DirectoryEntry) => {
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

const entryForWriteFile = shallowRef<DirectoryEntry>();

const onClickAddFile = (directoryEntry: DirectoryEntry) => {
  entryForWriteFile.value = directoryEntry;
};

const onCancelWriteFile = () => {
  entryForWriteFile.value = undefined;
};

const onWrittenFile = () => {
  entryForWriteFile.value = undefined;
};

const sourceMoveEntry = shallowRef<DirectoryEntry | FileEntry>();

const onClickMoveTo = (entry: DirectoryEntry | FileEntry) => {
  sourceMoveEntry.value = entry;
};

const onCancelMove = () => {
  sourceMoveEntry.value = undefined;
};

const onMovedEntry = () => {
  sourceMoveEntry.value = undefined;
};
</script>

<template>
  <div class="menu-label is-flex is-justify-content-space-between">
    {{ entry.name }}
    <div class="buttons has-addons">
      <slot name="buttonAddons" />

      <button
        class="button is-small"
        type="button"
        title="create new directory"
        @click="onClickCreateDirectory(entry)"
      >
        <span class="icon is-small">
          <i class="fa-solid fa-folder-plus" />
        </span>
      </button>
    </div>
  </div>

  <EntryList :directory-entry="entry">
    <template #contextMenu="{ entry: entryMenu }">
      <span class="dropdown-item">
        {{ entryMenu.name }}
      </span>

      <hr class="dropdown-divider" />

      <button
        v-if="'createDirectory' in entryMenu"
        type="button"
        class="dropdown-item"
        title="create new directory"
        @click="onClickCreateDirectory(entryMenu)"
      >
        <span class="icon is-small">
          <i class="fa-solid fa-folder-plus" />
        </span>

        <span class="ml-2">create directory</span>
      </button>

      <button
        v-if="'writeFile' in entryMenu"
        type="button"
        class="dropdown-item"
        title="add file"
        @click="onClickAddFile(entryMenu)"
      >
        <span class="icon is-small">
          <i class="fa-solid fa-file-circle-plus" />
        </span>

        <span class="ml-2">add file</span>
      </button>

      <button
        v-if="'moveTo' in entryMenu"
        type="button"
        class="dropdown-item"
        :title="`move ${entryMenu.name}`"
        @click="onClickMoveTo(entryMenu)"
      >
        <span class="icon is-small">
          <i class="fa-solid fa-arrow-right-arrow-left" />
        </span>

        <span class="ml-2">move to</span>
      </button>

      <button
        type="button"
        class="dropdown-item"
        :title="`remove \'${entryMenu.name}\'`"
        @click="onRemove(entryMenu)"
      >
        <span class="icon is-small"><i class="fa-solid fa-trash" /></span>

        <span class="ml-2">remove</span>
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

  <ModalCard v-if="entryForWriteFile">
    <AddFileForm
      :directory-entry="entryForWriteFile"
      @cancel="onCancelWriteFile"
      @written="onWrittenFile"
    />
  </ModalCard>

  <ModalCard v-if="sourceMoveEntry">
    <MoveEntryForm
      :entry="sourceMoveEntry"
      :target-entry="entry"
      @cancel="onCancelMove"
      @moved="onMovedEntry"
    />
  </ModalCard>
</template>
