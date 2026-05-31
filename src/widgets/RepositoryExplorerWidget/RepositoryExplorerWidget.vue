<script setup lang="ts">
import { computed, toRefs } from 'vue';
import {
  DeviceDirectoryAccessRecoveryState,
  getDeviceDirectoryAccessRecoveryError,
} from '@entity/deviceDirectoryAccess';
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
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import RepositoryExplorerDocumentsSection from './RepositoryExplorerDocumentsSection.vue';
import RepositoryExplorerFilesSection from './RepositoryExplorerFilesSection.vue';
import { useRepositoryExplorerDirectoryState } from './useRepositoryExplorerDirectoryState';

const props = defineProps<{
  directoryPath: string;
  deviceDirectoryAccessGrantDisabled?: boolean | undefined;
  deviceDirectoryAccessGrantLoading?: boolean | undefined;
  deviceDirectoryAccessMessage?: string | undefined;
}>();

const emit = defineEmits<{
  clickPath: [path: string];
  clickDocument: [documentId: AMDocumentId];
  clickReturnHome: [];
  grantDeviceDirectoryAccess: [];
  cancelDeviceDirectoryAccess: [];
}>();

defineSlots<{
  after: () => unknown;
}>();

const { directoryPath } = toRefs(props);

const {
  directoryError,
  documentIds,
  errorMessage,
  hideAutomergeFiles,
  isLoading,
  isRepositoryInitialized,
  regularFileEntries,
  repositoryError,
} = useRepositoryExplorerDirectoryState(directoryPath);

const onClickPath = (path: string) => {
  emit('clickPath', path);
};

const onClickDocument = (documentId: AMDocumentId) => {
  emit('clickDocument', documentId);
};

const hasGoogleDriveRecovery = computed(
  () =>
    !!errorMessage.value &&
    !!getGoogleDriveAccessRecoveryError(directoryPath.value, [
      directoryError.value,
      repositoryError.value,
    ]),
);
const recoveryErrors = computed(() => [directoryError.value, repositoryError.value]);
const hasDeviceDirectoryAccessRecovery = computed(
  () => !!getDeviceDirectoryAccessRecoveryError(recoveryErrors.value),
);

const { isRetryAuthorizationLoading, onRetryAuthorization } = useGoogleDriveRecovery({
  path: directoryPath,
});

const onReturnHomeClick = () => {
  emit('clickReturnHome');
};

const onGrantDeviceDirectoryAccess = () => {
  emit('grantDeviceDirectoryAccess');
};

const onCancelDeviceDirectoryAccess = () => {
  emit('cancelDeviceDirectoryAccess');
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
        v-if="hasDeviceDirectoryAccessRecovery"
        :errors="recoveryErrors"
      >
        <template #actions>
          <MDButton
            label="Grant access"
            :disabled="deviceDirectoryAccessGrantDisabled"
            :loading="deviceDirectoryAccessGrantLoading"
            @click="onGrantDeviceDirectoryAccess"
          />

          <MDButton label="Cancel" color="text" @click="onCancelDeviceDirectoryAccess" />
        </template>
      </DeviceDirectoryAccessRecoveryState>

      <MDEmptyState
        v-else-if="deviceDirectoryAccessMessage"
        class="repository-explorer-widget__error"
        headline="Permission required"
        :supporting-text="deviceDirectoryAccessMessage"
      >
        <template #icon>
          <MDSymbol name="error" class="repository-explorer-widget__error-icon" />
        </template>
      </MDEmptyState>

      <GoogleDriveAccessRecoveryState
        v-else-if="hasGoogleDriveRecovery"
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
          :regular-file-entries="regularFileEntries"
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
