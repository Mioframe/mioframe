<script setup lang="ts">
import { reactive } from 'vue';
import { MountedDirectoryWidget } from '../widgets/MountedDirectory';
import type { DirectoryEntry } from '../entities/entry';
import { createDirectoryEntry } from '../entities/entry';

const mountedDirectories = reactive<Set<DirectoryEntry>>(new Set());

const mountDirectory = async () => {
  if ('showDirectoryPicker' in globalThis) {
    const entry = createDirectoryEntry(await globalThis.showDirectoryPicker());
    mountedDirectories.add(entry);
  }
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
              <span> mount directory </span>
            </button>
          </li>
        </ul>

        <hr />

        <MountedDirectoryWidget
          v-for="entry in mountedDirectories"
          :key="entry.name"
          :entry="entry"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
hr {
  --bulma-hr-margin: 0.75em 0;
}
</style>
