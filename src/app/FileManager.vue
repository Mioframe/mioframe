<script setup lang="ts">
import { reactive } from 'vue';
import { MountedDirectoryWidget } from '../widgets/MountedDirectory';
import type { DirectoryEntryRef } from '../entities/entry';
import { createRootDirectoryEntryRef } from '../entities/entry';

const mountedDirectories = reactive<Set<DirectoryEntryRef>>(new Set());

const mountDirectory = async () => {
  if ('showDirectoryPicker' in globalThis) {
    const entry: DirectoryEntryRef = createRootDirectoryEntryRef(
      await globalThis.showDirectoryPicker(),
    );
    mountedDirectories.add(entry);
  }
};

const unmountDirectory = (entry: DirectoryEntryRef) => {
  mountedDirectories.delete(entry);
};
</script>

<template>
  <div class="file-manager">
    <div class="header flex" />

    <div class="body">
      <div class="menu">
        <ul class="menu-list">
          <li>
            <button
              type="button"
              class="button is-link"
              @click="mountDirectory"
            >
              <span class="icon">
                <i class="fa-solid fa-plug" />
              </span>

              <span> mount directory </span>
            </button>
          </li>
        </ul>

        <hr />

        <MountedDirectoryWidget
          v-for="entry in mountedDirectories"
          :key="entry.name"
          :entry="entry"
        >
          <template #buttonAddons>
            <button
              class="button is-small"
              type="button"
              :title="`unmount ${entry.name}`"
              @click="unmountDirectory(entry)"
            >
              <span class="icon is-small">
                <i class="fa-solid fa-eject" />
              </span>
            </button>
          </template>
        </MountedDirectoryWidget>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
hr {
  --bulma-hr-margin: 0.75em 0;
}
</style>
