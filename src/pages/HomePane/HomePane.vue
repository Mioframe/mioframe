<script setup lang="ts">
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import { useStackNavigation } from '@page/routes';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { GOOGLE_DRIVE_ROOT_NAME } from '@shared/service/google/useGoogleService';
import { GoogleDriveWidget } from '@widget/GoogleDriveWidget';
import { LocalFSWidget } from '@widget/LocalFSWidget';

defineSlots<{
  navigationButton: () => unknown;
}>();

const { open } = useStackNavigation();

const onClickGoogleDriveUser = async (email: string) => {
  await open(
    'repo',
    {
      repoPath: PathUtils.join(GOOGLE_DRIVE_ROOT_NAME, email),
    },
    { target: 'repo' },
  );
};

const onClickLocalPath = async (path: string) => {
  await open('repo', { repoPath: path }, { target: 'repo' });
};
</script>

<template>
  <MDPane class="home" allow-bottom-navigation>
    <MDAppBar />

    <LocalFSWidget @click-path="onClickLocalPath" />

    <GoogleDriveWidget @click-user="onClickGoogleDriveUser" />
    <!-- todo: создать и добавить виджет избранных директорий и документов -->
  </MDPane>
</template>

<style lang="css" scoped>
.home {
  --md-container-color: inherit;
  --md-content-color: inherit;
}
</style>
