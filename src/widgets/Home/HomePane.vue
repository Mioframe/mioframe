<script setup lang="ts">
import { MountedDirectoriesList } from '@entity/mountedDirectories';
import { MDFab, MDFabContainer, MDIconButton } from '@shared/ui/Button';
import { MDPaneContainer } from '@shared/ui/Layers';
import { useMainNavigate } from '@widget/MainView/useMainNavigate';
import { MDSymbol } from '@shared/ui/Icon';
import { useDirectoryStoreClient } from '@entity/mountedDirectories/useDirectoryStoreClient';
import { OPFSName } from '@shared/api/directories';
import { MDAppBar } from '@shared/ui/AppBar';

const { open: openDirectory } = useMainNavigate();

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
    <MDAppBar>
      <template #leadingButton>
        <MDIconButton tooltip="menu" md-symbol-name="menu" />
      </template>

      <template #trailingElements>
        <MDIconButton tooltip="settings" md-symbol-name="settings" />
      </template>
    </MDAppBar>

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
  --md-container-color: inherit;
  --md-content-color: inherit;

  &__fab-container {
    margin-top: auto;
  }
}
</style>
