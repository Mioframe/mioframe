<script setup lang="ts">
import { MountedDirectoriesList } from '@entity/mountedDirectories';
import { MDFab, MDFabContainer, MDIconButton } from '@shared/ui/Button';
import { MDPane } from '@shared/ui/Layout';
import { MDSymbol } from '@shared/ui/Icon';
import { useFileSystem } from '@entity/mountedDirectories/useFileSystem';
import { OPFSName } from '@shared/service/directories';
import { MDAppBar } from '@shared/ui/AppBar';
import { useStackNavigation } from '@page/routes';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { GoogleDriveWidget } from '@widget/GoogleDriveWidget';

defineSlots<{
  navigationButton: () => unknown;
}>();

const { open } = useStackNavigation();

const { mountUserDirectory } = useFileSystem();

const onClickMountUserDirectory = async () => {
  await mountUserDirectory();
};

const onClickRootDirectory = async (name: string) => {
  await open('repo', { repoPath: PathUtils.join('/', name) });
};

const onClickAccount = async () => {
  await open('accounts', {}, { target: 'accounts' });
};
</script>

<template>
  <MDPane class="home" allow-bottom-navigation>
    <MDAppBar>
      <template #trailingElements>
        <MDIconButton
          tooltip="account"
          md-symbol-name="person"
          @click="onClickAccount"
        />
      </template>
    </MDAppBar>

    <!-- todo: заменить на виджеты -->
    <MountedDirectoriesList @click="onClickRootDirectory">
      <template #leadingIcon="{ name }">
        <MDSymbol v-if="name === OPFSName" name="folder_special" />
      </template>
    </MountedDirectoriesList>

    <GoogleDriveWidget />
    <!-- todo: добавить виджет смонтированных папок -->
    <!-- todo: создать и добавить виджет избранных директорий и документов -->

    <MDFabContainer class="home__fab-container">
      <!-- todo: заменить на кнопку монтирования в виджете -->
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
