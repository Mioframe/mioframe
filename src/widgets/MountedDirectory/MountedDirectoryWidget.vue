<script setup lang="ts">
import type { DirectoryEntry, FileEntry } from '../../entities/entry';
import { EntryList } from '../../entities/entry';
import {
  CreateDirectoryForm,
  useCreateDirectoryFeature,
} from '../../features/createDirectory';
import { ModalCard } from '../../shared/ui/ModalCard';
import {
  RemoveEntryForm,
  useRemoveEntryFeature,
} from '../../features/removeEntry';
import { AddFileForm, useWriteFileFeature } from '../../features/addFile';
import { MoveEntryForm, useMoveEntryFeature } from '../../features/moveEntry';
import { useCopyEntryFeature } from '../../features/copyEntry';
import CopyEntryForm from '../../features/copyEntry/CopyEntryForm.vue';
import {
  RenameEntryForm,
  useRenameEntryFeature,
} from '../../features/renameEntry';

defineProps<{
  entry: DirectoryEntry;
}>();

defineSlots<{
  buttonAddons: () => unknown;
}>();

const {
  directoryCreateDestination,
  clearDirectoryDestination: onCancelCreateDirectory,
  setDirectoryDestination: onClickCreateDirectory,
  clearDirectoryDestination: onCreateDirectory,
} = useCreateDirectoryFeature();

const {
  fileWriteDestination,
  clearFileWriteDestination: onCancelWriteFile,
  setFileWriteDestination: onClickAddFile,
  clearFileWriteDestination: onWrittenFile,
} = useWriteFileFeature();

const {
  entryToBeRemoved,
  clearEntryToBeRemoved: onCancelRemoved,
  setEntryToBeRemoved: onRemove,
  clearEntryToBeRemoved: onRemoved,
} = useRemoveEntryFeature();

const {
  clearSourceMoveEntry: onCancelMove,
  setSourceMoveEntry: onClickMoveTo,
  clearSourceMoveEntry: onMovedEntry,
  sourceMoveEntry,
} = useMoveEntryFeature();

const {
  clearCopyableEntry: onCancelCopy,
  clearCopyableEntry: onCopiedEntry,
  copyableEntry,
  setCopyableEntry: onClickCopyTo,
} = useCopyEntryFeature();

const {
  clearRenameEntry: onCancelRename,
  clearRenameEntry: onRenamed,
  selectedRenameEntry,
  setRenameEntry: onClickRename,
} = useRenameEntryFeature();
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
        v-if="'rename' in entryMenu"
        type="button"
        class="dropdown-item"
        :title="`rename ${entryMenu.name}`"
        @click="onClickRename(entryMenu)"
      >
        <span class="icon is-small">
          <i class="fa-solid fa-i-cursor" />
        </span>

        <span class="ml-2">rename</span>
      </button>

      <button
        v-if="'copyTo' in entryMenu"
        type="button"
        class="dropdown-item"
        :title="`move ${entryMenu.name}`"
        @click="onClickCopyTo(entryMenu)"
      >
        <span class="icon is-small">
          <i class="fa-solid fa-copy" />
        </span>

        <span class="ml-2">copy to</span>
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

  <ModalCard v-if="directoryCreateDestination">
    <CreateDirectoryForm
      :parent-entry="directoryCreateDestination"
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

  <ModalCard v-if="fileWriteDestination">
    <AddFileForm
      :directory-entry="fileWriteDestination"
      @cancel="onCancelWriteFile"
      @written="onWrittenFile"
    />
  </ModalCard>

  <ModalCard v-if="sourceMoveEntry">
    <MoveEntryForm
      :source-entry="sourceMoveEntry"
      :accessible-destination="entry"
      @cancel="onCancelMove"
      @moved="onMovedEntry"
    />
  </ModalCard>

  <ModalCard v-if="copyableEntry">
    <CopyEntryForm
      :source-entry="copyableEntry"
      :accessible-destination="entry"
      @cancel="onCancelCopy"
      @copied="onCopiedEntry"
    />
  </ModalCard>

  <ModalCard v-if="selectedRenameEntry">
    <RenameEntryForm
      :entry="selectedRenameEntry"
      @cancel="onCancelRename"
      @renamed="onRenamed"
    />
  </ModalCard>
</template>
