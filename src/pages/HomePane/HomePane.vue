<script setup lang="ts">
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import { useStackNavigation } from '@page/routes';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { GOOGLE_DRIVE_ROOT_NAME } from '@shared/service/google/useGoogleService';
import { GoogleDriveWidget } from '@widget/GoogleDriveWidget';
import { LocalFSWidget } from '@widget/LocalFSWidget';
import { StarterExamplesWidget } from '@widget/StarterExamplesWidget';
import type { AMDocumentId } from '@shared/lib/automerge';
import { useLocalSettings } from '@entity/localSettings';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { open } = useStackNavigation();
const { settings } = useLocalSettings();

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

const openDocument = async (documentDirectory: string, documentId: AMDocumentId) => {
  await open(
    'document',
    {
      documentDirectory,
      documentId,
    },
    {
      target: 'document',
    },
  );
};

const onOpenStarterExampleDocument = ({
  documentDirectory,
  documentId,
}: {
  documentDirectory: string;
  documentId: AMDocumentId;
}) => {
  return openDocument(documentDirectory, documentId);
};
</script>

<template>
  <MDPane class="home" allow-bottom-navigation>
    <MDAppBar>
      <template #trailingElements>
        <slot name="appBarTrailing" />
      </template>
    </MDAppBar>

    <StarterExamplesWidget
      v-if="!settings.hideStarterWidget"
      @open-document="onOpenStarterExampleDocument"
    />

    <LocalFSWidget @click-path="onClickLocalPath" />

    <GoogleDriveWidget @click-user="onClickGoogleDriveUser" />
    <!-- todo: создать и добавить виджет избранных директорий и документов -->
  </MDPane>
</template>

<style lang="css" scoped>
.home {
  --md-container-color: inherit;
  --md-content-color: inherit;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
