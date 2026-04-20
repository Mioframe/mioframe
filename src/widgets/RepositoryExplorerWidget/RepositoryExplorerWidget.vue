<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useGoogleDriveRecovery } from '@feature/googleDriveRecovery';
import { MDButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDNavigationPath } from '@shared/ui/NavigationPath';
import {
  getGoogleDriveAccessRecoveryError,
  GoogleDriveAccessRecoveryState,
} from '@entity/googleDriveAccess';
import { MDListContainer } from '@shared/ui/Lists';
import { CFRDocumentMDListItem } from '@entity/cfrDocument';
import { FSEntryMDListItem } from '@entity/fsEntry';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { useRepository } from '@entity/repository';
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import { useDirectory } from '@entity/directory/useDirectory';
import type { ReadDirectoryOptions } from '@shared/service/fileSystem';
import { useLocalSettings } from '@entity/localSettings';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import { MDEmptyState } from '@shared/ui/EmptyState';
import { DocumentManageMenuButton } from '@feature/documentManage';
import { FSEntryManageMenuButton } from '@feature/entryManage';

const props = defineProps<{
  directoryPath: string;
}>();

const emit = defineEmits<{
  clickPath: [path: string];
  clickDocument: [documentId: AMDocumentId];
  clickReturnHome: [];
}>();

defineSlots<{
  after: () => unknown;
}>();

const { directoryPath } = toRefs(props);

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

const onClickPath = (path: string) => {
  emit('clickPath', path);
};

const onClickDirectoryEntry = (name: string, fileType: FSNodeType) => {
  if (fileType === FSNodeType.Directory) {
    emit('clickPath', PathUtils.join(directoryPath.value, name));
  }
};

const {
  state: documentIdList,
  error: repositoryError,
  errorMessage: repositoryErrorMessage,
} = useRepository(directoryPath);

const onClickDocument = (documentId: AMDocumentId) => {
  emit('clickDocument', documentId);
};

const hasGoogleDriveRecovery = computed(
  () =>
    !!getGoogleDriveAccessRecoveryError(directoryPath.value, [
      directoryError.value,
      repositoryError.value,
    ]),
);

const errorHeadline = computed(() =>
  directoryErrorMessage.value ? 'Directory read error' : 'Repository read error',
);

const errorMessage = computed(() => directoryErrorMessage.value ?? repositoryErrorMessage.value);

const { isRetryAuthorizationLoading, onRetryAuthorization } = useGoogleDriveRecovery({
  path: directoryPath,
});
</script>

<template>
  <div class="repository-explorer-widget">
    <MDNavigationPath
      :path="directoryPath"
      class="repository-explorer-widget__navigation-path"
      @click="onClickPath"
    />

    <div class="repository-explorer-widget__scrollable-content">
      <MDListContainer is="div" class="repository-explorer-widget__content-list">
        <CFRDocumentMDListItem
          is="button"
          v-for="docId in documentIdList"
          :key="docId"
          :document-id="docId"
          :path="directoryPath"
          class="repository-explorer-widget__list-item"
          @click="onClickDocument(docId)"
        >
          <template #trailingIcon>
            <DocumentManageMenuButton :directory-path="directoryPath" :document-id="docId" />
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

            <MDButton label="Return Home" color="text" @click="emit('clickReturnHome')" />
          </template>
        </GoogleDriveAccessRecoveryState>

        <MDEmptyState
          v-if="!hasGoogleDriveRecovery && errorMessage"
          class="repository-explorer-widget__error"
          :headline="errorHeadline"
          :supporting-text="errorMessage"
        >
          <template #icon>
            <MDSymbol name="error" class="repository-explorer-widget__error-icon" />
          </template>
        </MDEmptyState>

        <div v-if="directoryLoading" class="repository-explorer-widget__loading">
          <MDCircularProgressIndicator :size="24" />
        </div>

        <FSEntryMDListItem
          v-for="[name, { description, type: nodeType }] in directoryEntries"
          :key="name"
          is-button
          :name="name"
          :supporting-text="description"
          :type="nodeType"
          class="repository-explorer-widget__list-item"
          @click="onClickDirectoryEntry(name, nodeType)"
        >
          <template #trailingIcon>
            <FSEntryManageMenuButton :path="PathUtils.join(directoryPath, name)" />
          </template>
        </FSEntryMDListItem>
      </MDListContainer>

      <slot name="after" />
    </div>
  </div>
</template>

<style scoped>
.repository-explorer-widget {
  display: flex;
  flex: 1 1;
  flex-direction: column;
  min-height: 0;

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
    min-height: 0;
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
