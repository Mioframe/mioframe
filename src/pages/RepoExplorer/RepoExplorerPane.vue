<script setup lang="ts">
import { computed, ref, toRefs } from 'vue';
import { DirectoryCreateDialog } from '@feature/directoryCreate';
import { useGoogleDriveRecovery } from '@feature/googleDriveRecovery';
import { MDButton, MDFab, MDFabContainer } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDNavigationPath } from '@shared/ui/NavigationPath';
import { DocumentCreationDialog } from '@feature/documentCreate';
import {
  getGoogleDriveAccessRecoveryError,
  GoogleDriveAccessRecoveryState,
} from '@entity/googleDriveAccess';
import { MDListContainer } from '@shared/ui/Lists';
import { CFRDocumentMDListItem } from '@entity/cfrDocument';
import { FSEntryMDListItem } from '@entity/fsEntry';
import { useFSNodeStat } from '@entity/fsEntry';
import { MDPane } from '@shared/ui/Layout';
import { MDAppBar } from '@shared/ui/AppBar';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { zodQuery } from './model';
import { useStackNavigation } from '@page/routes';
import { zodToVueProps } from '@shared/lib/zodToVueProps';
import { useRepository } from '@entity/repository';
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import { useDirectory } from '@entity/directory/useDirectory';
import type { ReadDirectoryOptions } from '@shared/service/fileSystem';
import { useLocalSettings } from '@entity/localSettings';
import DocumentContextButton from './DocumentContextButton.vue';
import FSEntryContextButton from './FSEntryContextButton.vue';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { MDEmptyState } from '@shared/ui/EmptyState';

const props = defineProps(zodToVueProps(zodQuery));

const { repoPath: directoryPath } = toRefs(props);

defineSlots<{
  navigationButton: () => unknown;
}>();

const parentPathForNewDirectory = ref<string>();

const onClickCreateDirectory = () => {
  parentPathForNewDirectory.value = directoryPath.value;
};

const { settings } = useLocalSettings();

const readDirectoryOptions = computed(
  (): ReadDirectoryOptions => ({
    hideAutomergeFiles: !settings.value.showAutomergeFiles,
  }),
);

const {
  data: directoryEntries,
  error: directoryError,
  errorMessage: directoryErrorMessage,
  isLoading: directoryLoading,
} = useDirectory(directoryPath, readDirectoryOptions);
const { data: directoryStat } = useFSNodeStat(directoryPath);

const { open } = useStackNavigation();

const onClickPath = async (path: string) => {
  await open('repo', {
    repoPath: path,
  });
};

const onClickEntry = async (name: string, fileType: FSNodeType) => {
  if (fileType === FSNodeType.Directory) {
    await open('repo', {
      repoPath: PathUtils.join(directoryPath.value, name),
    });
  }
};

const showFormNewDocument = ref(false);

const onClickCreateDocument = () => {
  showFormNewDocument.value = true;
};

const {
  state: documentIdList,
  error: repositoryError,
  errorMessage: repositoryErrorMessage,
} = useRepository(directoryPath);

const onClickDocument = async (documentId: AMDocumentId) => {
  await open(
    'document',
    {
      documentDirectory: directoryPath.value,
      documentId,
    },
    {
      target: 'document',
    },
  );
};

const title = computed(() => PathUtils.basename(directoryPath.value) || 'root');

const canEditDirectoryContents = computed(
  () => directoryStat.value?.capabilities?.canEditChildren === true,
);

const hasGoogleDriveRecovery = computed(
  () =>
    !!getGoogleDriveAccessRecoveryError(directoryPath.value, [
      directoryError.value,
      repositoryError.value,
    ]),
);

const fallbackErrorHeadline = computed(() =>
  directoryErrorMessage.value
    ? 'Directory read error'
    : 'Repository read error',
);

const fallbackErrorMessage = computed(
  () => directoryErrorMessage.value ?? repositoryErrorMessage.value,
);

const { isRetryAuthorizationLoading, onRetryAuthorization } =
  useGoogleDriveRecovery({
    path: directoryPath,
  });

const onClickReturnHome = async () => {
  await open('home', {}, { additionalPanes: 0, replace: true });
};
</script>

<template>
  <MDPane class="document-explorer-widget">
    <MDAppBar v-if="title" :headline="title">
      <template #leadingButton>
        <slot name="navigationButton" />
      </template>

      <template #trailingElements>
        <FSEntryContextButton :path="directoryPath" />
      </template>
    </MDAppBar>

    <MDNavigationPath
      v-if="directoryPath"
      :path="directoryPath"
      class="document-explorer-widget__navigation-path"
      @click="onClickPath"
    />

    <div class="document-explorer-widget__scrollable-content">
      <MDListContainer
        is="div"
        v-if="directoryPath"
        class="document-explorer-widget__content-list"
      >
        <CFRDocumentMDListItem
          is="button"
          v-for="docId in documentIdList"
          :key="docId"
          :document-id="docId"
          :path="directoryPath"
          class="document-explorer-widget__list-item"
          @click="onClickDocument(docId)"
        >
          <template #trailingIcon>
            <DocumentContextButton
              :directory-path="directoryPath"
              :document-id="docId"
            />
          </template>
        </CFRDocumentMDListItem>

        <GoogleDriveAccessRecoveryState
          v-if="hasGoogleDriveRecovery"
          :path="directoryPath"
          :errors="[directoryError, repositoryError]"
        >
          <template #actions>
            <MDButton
              label="Retry Authorization"
              :loading="isRetryAuthorizationLoading"
              @click="onRetryAuthorization"
            />

            <MDButton
              label="Return Home"
              color="text"
              @click="onClickReturnHome"
            />
          </template>
        </GoogleDriveAccessRecoveryState>

        <MDEmptyState
          v-if="!hasGoogleDriveRecovery && fallbackErrorMessage"
          class="document-explorer-widget__error"
          :headline="fallbackErrorHeadline"
          :supporting-text="fallbackErrorMessage"
        >
          <template #icon>
            <MDSymbol
              name="error"
              class="document-explorer-widget__error-icon"
            />
          </template>
        </MDEmptyState>

        <div v-if="directoryLoading" class="document-explorer-widget__loading">
          <MDCircularProgressIndicator :size="24" />
        </div>

        <FSEntryMDListItem
          v-for="[name, { type: nodeType }] in directoryEntries"
          :key="name"
          is-button
          :name="name"
          :type="nodeType"
          class="document-explorer-widget__list-item"
          @click="onClickEntry(name, nodeType)"
        >
          <template #trailingIcon>
            <FSEntryContextButton :path="PathUtils.join(directoryPath, name)" />
          </template>
        </FSEntryMDListItem>
      </MDListContainer>

      <MDFabContainer class="document-explorer-widget__fab-container" auto-hide>
        <template #default>
          <MDFab
            v-if="canEditDirectoryContents"
            tooltip="Create directory"
            color="tonal-primary"
            @click="onClickCreateDirectory"
          >
            <template #icon>
              <MDSymbol name="create_new_folder" />
            </template>
          </MDFab>

          <MDFab
            v-if="canEditDirectoryContents"
            tooltip="Create document"
            size="medium"
            color="tonal-primary"
            @click="onClickCreateDocument"
          >
            <template #icon>
              <MDSymbol name="edit_document" />
            </template>
          </MDFab>
        </template>
      </MDFabContainer>
    </div>

    <DocumentCreationDialog
      v-if="directoryPath"
      v-model:show="showFormNewDocument"
      :path="directoryPath"
      @cancel="showFormNewDocument = false"
      @created="showFormNewDocument = false"
    />

    <DirectoryCreateDialog
      v-if="parentPathForNewDirectory"
      :show="!!parentPathForNewDirectory"
      :path="parentPathForNewDirectory"
      @update:show="
        parentPathForNewDirectory = $event
          ? parentPathForNewDirectory
          : undefined
      "
      @cancel="parentPathForNewDirectory = undefined"
      @created="parentPathForNewDirectory = undefined"
    />
  </MDPane>
</template>

<style scoped>
.document-explorer-widget {
  &__fab-container {
    position: sticky;
    bottom: 0;
    flex-shrink: 0;
  }

  &__navigation-path {
    position: sticky;
    top: 0;
    flex-shrink: 0;
    padding-left: 2step;
  }

  &__content-list {
    flex: 1 0;
  }

  &__list-item {
    --md-list-item-border-radius: 8px;
  }

  &__scrollable-content {
    overflow-y: auto;
    flex: 1 1;
    display: flex;
    flex-direction: column;
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    --md-content-color: var(--md-sys-color-primary);
    padding: 2step;
  }

  &__error-icon {
    --md-content-color: var(--md-sys-color-error);
  }
}
</style>
