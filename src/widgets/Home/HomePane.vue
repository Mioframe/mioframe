<script setup lang="ts">
import MountedDirectoriesList from '@entity/mountedDirectories/MountedDirectoriesList.vue';
import { MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDPaneContainer } from '@shared/ui/Layers';
import { useMountDirectoryFromBrowser } from '@feature/mountDirectoryFromBrowser';
import { useRepoExplorerNavigate } from '@widget/MainView/useRepoExplorerNavigate';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { MDSymbol } from '@shared/ui/Icon';
import { OPFSName } from '@feature/mountDirectoryFromBrowser/useMountDirectoryFromBrowser';

const { mountUserDirectory } = useMountDirectoryFromBrowser();
const { open: openDirectory } = useRepoExplorerNavigate();

const onClickMountUserDirectory = async () => {
  await mountUserDirectory();
};

const onClickMountedDirectory = async ({ name }: DirectoryFSEntry) => {
  await openDirectory({ path: [name], document: undefined });
};
</script>

<template>
  <MDPaneContainer class="home">
    <MountedDirectoriesList is="button" @click="onClickMountedDirectory">
      <template #leadingIcon="{ name }">
        <MDSymbol v-if="name === OPFSName" name="folder_special" />
      </template>
    </MountedDirectoriesList>

    <MDFabContainer class="home__fab-container">
      <MDFab
        tooltip="select local directory"
        md-symbol="folder_open"
        @click="onClickMountUserDirectory"
      />
    </MDFabContainer>
  </MDPaneContainer>
</template>

<style lang="css" scoped>
.home {
  padding: 8px;
  flex-grow: 1;

  &__fab-container {
    margin-top: auto;
  }
}
</style>
