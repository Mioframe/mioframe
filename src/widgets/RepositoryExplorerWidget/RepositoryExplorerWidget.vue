<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useDeviceDirectoryAccessRecovery } from '@feature/deviceDirectoryAccessRecovery';
import { useGoogleDriveRecovery } from '@feature/googleDriveRecovery';
import { useFSNodeStat } from '@entity/fsEntry';
import { DeviceDirectoryAccessRecoveryState } from '@entity/deviceDirectoryAccess';
import {
  getGoogleDriveAccessRecoveryError,
  GoogleDriveAccessRecoveryState,
} from '@entity/googleDriveAccess';
import { MDButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { MDNavigationPath } from '@shared/ui/NavigationPath';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { MDEmptyState } from '@shared/ui/EmptyState';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import RepositoryExplorerDocumentsSection from './RepositoryExplorerDocumentsSection.vue';
import RepositoryExplorerFilesSection from './RepositoryExplorerFilesSection.vue';
import { useRepositoryExplorerDirectoryState } from './useRepositoryExplorerDirectoryState';

const props = defineProps<{
  directoryPath: string;
}>();

const emit = defineEmits<{
  clickPath: [path: string];
  clickDocument: [documentId: AMDocumentId];
  clickReturnHome: [];
  retryCurrentPath: [];
}>();

defineSlots<{
  after: (props: { canEditDirectoryContents: boolean }) => unknown;
}>();

const { directoryPath } = toRefs(props);
const { data: directoryStat, error: directoryStatError } = useFSNodeStat(directoryPath);
const repositoryExplorerDirectoryState = useRepositoryExplorerDirectoryState(directoryPath);
const {
  documentIds,
  errorMessage,
  hideAutomergeFiles,
  isLoading,
  isRepositoryInitialized,
  recoveryErrors: repositoryRecoveryErrors,
  regularFileEntries,
} = repositoryExplorerDirectoryState;
const recoveryErrors = computed(() => [
  ...repositoryRecoveryErrors.value,
  directoryStatError.value,
]);
const {
  grantAccess,
  grantDisabled,
  isGrantLoading,
  message: deviceDirectoryAccessMessage,
  recoveryState: deviceDirectoryAccessRecovery,
} = useDeviceDirectoryAccessRecovery({
  errors: recoveryErrors,
});
const hasGoogleDriveRecovery = computed(
  () =>
    !!errorMessage.value &&
    !!getGoogleDriveAccessRecoveryError(directoryPath.value, recoveryErrors.value),
);
const { isRetryAuthorizationLoading, onRetryAuthorization } = useGoogleDriveRecovery({
  path: directoryPath,
});
const canEditDirectoryContents = computed(
  () => directoryStat.value?.capabilities?.canEditChildren === true,
);

const onClickPath = (path: string) => {
  emit('clickPath', path);
};

const onClickDocument = (documentId: AMDocumentId) => {
  emit('clickDocument', documentId);
};

const onReturnHomeClick = () => {
  emit('clickReturnHome');
};

const onGrantDeviceDirectoryAccess = async () => {
  const result = await grantAccess();

  if (result.status === 'granted') {
    emit('retryCurrentPath');
  }
};
</script>

<template>
  <div class="repository-explorer-widget">
    <MDNavigationPath
      :path="directoryPath"
      hide-current
      class="repository-explorer-widget__navigation-path"
      @click="onClickPath"
      @click-home="onReturnHomeClick"
    />

    <div class="repository-explorer-widget__scrollable-content">
      <DeviceDirectoryAccessRecoveryState
        v-if="deviceDirectoryAccessRecovery"
        class="repository-explorer-widget__recovery"
        :errors="recoveryErrors"
        :message="deviceDirectoryAccessMessage"
      >
        <template #actions>
          <MDButton
            label="Grant access"
            :disabled="grantDisabled"
            :loading="isGrantLoading"
            @click="onGrantDeviceDirectoryAccess"
          />

          <MDButton label="Cancel" color="text" @click="onReturnHomeClick" />
        </template>
      </DeviceDirectoryAccessRecoveryState>

      <GoogleDriveAccessRecoveryState
        v-else-if="hasGoogleDriveRecovery"
        class="repository-explorer-widget__recovery"
        :path="directoryPath"
        :errors="recoveryErrors"
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
        v-else-if="errorMessage"
        class="repository-explorer-widget__error"
        headline="Could not open this folder"
        :supporting-text="errorMessage"
      >
        <template #icon>
          <MDSymbol name="error" class="repository-explorer-widget__error-icon" />
        </template>
      </MDEmptyState>

      <div v-else-if="isLoading" class="repository-explorer-widget__loading">
        <MDCircularProgressIndicator :size="24" />
      </div>

      <div v-else class="repository-explorer-widget__content">
        <RepositoryExplorerDocumentsSection
          :directory-path="directoryPath"
          :document-ids="documentIds ?? []"
          :is-repository-initialized="isRepositoryInitialized"
          @select-document="onClickDocument"
        />

        <RepositoryExplorerFilesSection
          :directory-path="directoryPath"
          :hide-automerge-files="hideAutomergeFiles"
          :regular-file-entries="regularFileEntries ?? []"
          @select-path="onClickPath"
        />
      </div>

      <slot name="after" :can-edit-directory-contents="canEditDirectoryContents" />
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
    align-content: start;
    gap: 24px;
    padding-bottom: 8px;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
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
