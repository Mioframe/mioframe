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
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { MDEmptyState } from '@shared/ui/EmptyState';
import { useMioframeSpaceDirectory } from '@entity/mioframeSpaceDirectory';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import RepositoryExplorerDocumentsSection from './RepositoryExplorerDocumentsSection.vue';
import RepositoryExplorerFilesSection from './RepositoryExplorerFilesSection.vue';

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

const { directoryError, repositoryError, viewState } = useMioframeSpaceDirectory(directoryPath);

const onClickPath = (path: string) => {
  emit('clickPath', path);
};

const onClickDocument = (documentId: AMDocumentId) => {
  emit('clickDocument', documentId);
};

const hasGoogleDriveRecovery = computed(
  () =>
    viewState.value.status === 'error' &&
    !!getGoogleDriveAccessRecoveryError(directoryPath.value, [
      directoryError.value,
      repositoryError.value,
    ]),
);

const { isRetryAuthorizationLoading, onRetryAuthorization } = useGoogleDriveRecovery({
  path: directoryPath,
});

const onReturnHomeClick = () => {
  emit('clickReturnHome');
};
</script>

<template>
  <div class="repository-explorer-widget">
    <MDNavigationPath
      :path="directoryPath"
      class="repository-explorer-widget__navigation-path"
      @click="onClickPath"
      @click-home="onReturnHomeClick"
    />

    <div class="repository-explorer-widget__scrollable-content">
      <GoogleDriveAccessRecoveryState
        v-if="hasGoogleDriveRecovery"
        :path="directoryPath"
        :errors="[directoryError, repositoryError]"
      >
        <template #actions>
          <MDButton
            label="Retry authorization"
            :loading="isRetryAuthorizationLoading"
            @click="onRetryAuthorization"
          />

          <MDButton label="Return home" color="text" @click="onReturnHomeClick" />
        </template>
      </GoogleDriveAccessRecoveryState>

      <MDEmptyState
        v-else-if="viewState.status === 'error'"
        class="repository-explorer-widget__error"
        headline="Could not open this folder"
        :supporting-text="viewState.message"
      >
        <template #icon>
          <MDSymbol name="error" class="repository-explorer-widget__error-icon" />
        </template>
      </MDEmptyState>

      <div v-else-if="viewState.status === 'loading'" class="repository-explorer-widget__loading">
        <MDCircularProgressIndicator :size="24" />
      </div>

      <div v-else class="repository-explorer-widget__content">
        <RepositoryExplorerDocumentsSection
          :directory-path="directoryPath"
          :document-ids="viewState.documentIds"
          :folder-state="viewState.folderState"
          @select-document="onClickDocument"
        />

        <RepositoryExplorerFilesSection
          :directory-path="directoryPath"
          :visible-file-entries="viewState.visibleFileEntries"
          @select-path="onClickPath"
        />
      </div>

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
    flex-shrink: 0;
    padding: 0 16px 8px;
  }

  &__scrollable-content {
    overflow-y: auto;
    flex: 1 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  &__content {
    display: grid;
    gap: 24px;
    padding-bottom: 8px;
  }

  &__error-icon {
    --md-content-color: var(--md-sys-color-error);
  }

  &__loading {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 120px;
    --md-content-color: var(--md-sys-color-primary);
  }
}
</style>
