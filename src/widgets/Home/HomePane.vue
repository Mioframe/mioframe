<script setup lang="ts">
import { MountedDirectoriesList } from '@entity/mountedDirectories';
import { MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDPaneContainer } from '@shared/ui/Layers';
import { useRepoExplorerNavigate } from '@widget/MainView/useRepoExplorerNavigate';
import { MDSymbol } from '@shared/ui/Icon';
import { useDirectoryStoreClient } from '@entity/mountedDirectories/useDirectoryStoreClient';
import { OPFSName } from '@shared/api/directories';

const { open: openDirectory } = useRepoExplorerNavigate();

const { mountUserDirectory } = useDirectoryStoreClient();

const onClickMountUserDirectory = async () => {
  await mountUserDirectory();
};

const onClickMountedDirectory = async (name: string) => {
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
