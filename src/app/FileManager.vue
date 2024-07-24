<script setup lang="ts">
import { reactive } from 'vue';
import { MountedDirectory } from '../widgets/MountedDirectory';

const mountedDirectories = reactive<Set<FileSystemDirectoryHandle>>(new Set());

const mountDirectory = async () => {
  if ('showDirectoryPicker' in globalThis) {
    mountedDirectories.add(await globalThis.showDirectoryPicker());
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

        <MountedDirectory
          v-for="handle in mountedDirectories"
          :key="handle.name"
          :handle
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
