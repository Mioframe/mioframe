<script setup lang="ts">
import { MDListItem } from '@shared/ui/Lists';
import MDListContainer from '@shared/ui/Lists/MDListContainer.vue';
import { vPressedState } from '@shared/lib/md/stateHelper';
import { MDSymbol } from '@shared/ui/Icon';
</script>

<template>
  <MDListContainer class="local-storage-widget">
    <MDListItem
      v-pressed-state
      headline="Browser Storage"
      class="storage-list__item"
      is-button
      supporting-text="Storage inside your browser"
      @click="onClickBrowserStorage"
    >
      <template #leadingIcon>
        <MDSymbol name="folder_special" />
      </template>
    </MDListItem>

    <MDListItem headline="Local Folder" class="storage-list__item">
      <template #leadingIcon>
        <MDSymbol name="folder" />
      </template>
    </MDListItem>
  </MDListContainer>
</template>

<style lang="css" scoped>
.local-storage-widget {
}
</style>
