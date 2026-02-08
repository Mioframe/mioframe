<script setup lang="ts">
import { MountedDirectoriesList } from '@entity/mountedDirectories';
import { MDFab, MDFabContainer, MDIconButton } from '@shared/ui/Button';
import { MDPane } from '@shared/ui/Layout';
import { MDSymbol } from '@shared/ui/Icon';
import { useFileSystem } from '@entity/mountedDirectories/useFileSystem';
import { OPFSName } from '@shared/service/directories';
import { MDAppBar } from '@shared/ui/AppBar';
import { useMainRouter } from '@page/routes';
import { PathUtils } from '@shared/lib/virtualFileSystem';

defineSlots<{
  navigationButton: () => unknown;
}>();

const { open } = useMainRouter();

const { mountUserDirectory } = useFileSystem();

const onClickMountUserDirectory = async () => {
  await mountUserDirectory();
};

const onClickRootDirectory = async (name: string) => {
  await open(
    'repo',
    { repoPath: PathUtils.join('/', name) },
    { additionalPanes: 1 },
  );
};

const onClickAccount = async () => {
  await open('accounts', {}, { additionalPanes: 1 });
};
</script>

<template>
  <MDPane class="home">
    <MDAppBar>
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <MDIconButton
          tooltip="account"
          md-symbol-name="person"
          @click="onClickAccount"
        />
      </template>
    </MDAppBar>

    <MountedDirectoriesList @click="onClickRootDirectory">
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
  </MDPane>
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
