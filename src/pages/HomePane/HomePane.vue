<script setup lang="ts">
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import { useStackNavigation } from '@page/routes';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { GOOGLE_DRIVE_ROOT_NAME } from '@shared/service';
import { GoogleDriveWidget } from '@widget/GoogleDriveWidget';
import { LocalFSWidget } from '@widget/LocalFSWidget';
import { StarterExamplesWidget } from '@widget/StarterExamplesWidget';
import { PwaInstallWidget } from '@widget/PwaInstallWidget';
import type { AMDocumentId } from '@shared/lib/automerge';
import { useLocalSettings } from '@entity/localSettings';
import { usePwaInstallAction } from '@feature/pwaInstall';
import { GOOGLE_DRIVE_INTEGRATION_AVAILABLE } from '@shared/config';

defineSlots<{
  navigationButton: () => unknown;
  appBarTrailing: () => unknown;
}>();

const { open } = useStackNavigation();
const { settings } = useLocalSettings();
const { isHomeWidgetVisible } = usePwaInstallAction();

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

const onCreatedStarterExampleDocument = ({
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
    <template #topBar>
      <MDAppBar>
        <template #trailingElements>
          <slot name="appBarTrailing" />
        </template>
      </MDAppBar>
    </template>

    <PwaInstallWidget v-if="isHomeWidgetVisible" />

    <StarterExamplesWidget
      v-if="!settings.hideStarterWidget"
      @created-document="onCreatedStarterExampleDocument"
    />

    <LocalFSWidget @click-path="onClickLocalPath" />

    <GoogleDriveWidget
      v-if="settings.googleDriveIntegrationEnabled === true && GOOGLE_DRIVE_INTEGRATION_AVAILABLE"
      @click-user="onClickGoogleDriveUser"
    />
    <!-- todo: создать и добавить виджет избранных директорий и документов -->
  </MDPane>
</template>

<style lang="css" scoped>
.home {
  --md-container-color: inherit;
  --md-content-color: inherit;
  --md-pane-content-gap: 16dp;
  display: flex;
  flex-direction: column;
}
</style>
