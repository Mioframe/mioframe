<script setup lang="ts">
import { reactive } from 'vue';
import { MountedDirectoryWidget } from '../widgets/MountedDirectory';
import type { LocalDirectoryRef } from '../entities/entry';
import { createRootDirectoryEntryRef } from '../entities/entry';

const mountedDirectories = reactive<Set<LocalDirectoryRef>>(new Set());

const mountDirectory = async () => {
  if ('showDirectoryPicker' in globalThis) {
    const entry: LocalDirectoryRef = createRootDirectoryEntryRef(
      await globalThis.showDirectoryPicker(),
    );
    mountedDirectories.add(entry);
  }
};

const unmountDirectory = (entry: LocalDirectoryRef) => {
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
            <button type="button" class="button" @click="mountDirectory">
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
          :key="entry.label"
          :entry="entry"
        >
          <template #buttonAddons>
            <button
              class="button is-small"
              type="button"
              :title="`unmount ${entry.label}`"
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
