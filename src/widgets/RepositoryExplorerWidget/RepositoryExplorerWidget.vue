<script setup lang="ts">
import { toRefs } from 'vue';
import { MDSymbol } from '@shared/ui/Icon';
import { MDNavigationPath } from '@shared/ui/NavigationPath';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import { MDEmptyState } from '@shared/ui/EmptyState';
import { MDCircularProgressIndicator } from '@shared/ui/ProgressIndicators';
import RepositoryExplorerDocumentsSection from './RepositoryExplorerDocumentsSection.vue';
import RepositoryExplorerFilesSection from './RepositoryExplorerFilesSection.vue';
import type { RepositoryDirectoryEntry } from '@shared/service/repositories';

const props = defineProps<{
  directoryPath: string;
  documentIds?: readonly AMDocumentId[] | undefined;
  errorMessage?: string | undefined;
  hideAutomergeFiles: boolean;
  isLoading: boolean;
  isRecoveryStateVisible?: boolean | undefined;
  isRepositoryInitialized: boolean;
  regularFileEntries?: readonly RepositoryDirectoryEntry[] | undefined;
}>();

const emit = defineEmits<{
  clickPath: [path: string];
  clickDocument: [documentId: AMDocumentId];
  clickReturnHome: [];
}>();

defineSlots<{
  after: () => unknown;
  recovery: () => unknown;
}>();

const { directoryPath } = toRefs(props);

const onClickPath = (path: string) => {
  emit('clickPath', path);
};

const onClickDocument = (documentId: AMDocumentId) => {
  emit('clickDocument', documentId);
};

const onReturnHomeClick = () => {
  emit('clickReturnHome');
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
      <slot v-if="isRecoveryStateVisible" name="recovery" />

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
