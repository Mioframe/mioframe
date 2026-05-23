<script setup lang="ts">
import { computed, toRefs } from 'vue';
import { useGoogleDriveRecovery } from '@feature/googleDriveRecovery';
import { MioframeStorageInfoSheet } from '@feature/mioframeStorageInfo';
import { MDButton, MDIconButton } from '@shared/ui/Button';
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
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import { MDEmptyState } from '@shared/ui/EmptyState';
import { DocumentManageMenuButton } from '@feature/documentManage';
import { FSEntryManageMenuButton } from '@feature/entryManage';
import { useMioframeSpaceDirectory } from '@entity/mioframeSpaceDirectory';
import { shallowRef } from 'vue';

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

const {
  documentIds,
  presentation,
  directoryError,
  directoryErrorMessage,
  repositoryError,
  repositoryErrorMessage,
} = useMioframeSpaceDirectory(directoryPath);

const onClickPath = (path: string) => {
  emit('clickPath', path);
};

const onClickDirectoryEntry = (name: string, fileType: FSNodeType) => {
  if (fileType === FSNodeType.Directory) {
    emit('clickPath', PathUtils.join(directoryPath.value, name));
  }
};

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

const recoveryErrors = [directoryError, repositoryError];

const onReturnHomeClick = () => {
  emit('clickReturnHome');
};

const showStorageInfoSheet = shallowRef(false);

const onOpenStorageInfoSheet = () => {
  showStorageInfoSheet.value = true;
};

const onCloseStorageInfoSheet = () => {
  showStorageInfoSheet.value = false;
};

const documentEmptyHeadline = computed(() => {
  switch (presentation.value.state) {
    case 'regularFolder':
      return 'В этой папке ещё нет пространства Mioframe.';
    case 'emptyMioframeSpace':
      return 'В этой папке пока нет документов Mioframe.';
    default:
      return undefined;
  }
});

const documentEmptySupportingText = computed(() => {
  switch (presentation.value.state) {
    case 'regularFolder':
      return 'Добавьте первый документ, чтобы начать хранить документы Mioframe в этой папке.';
    case 'emptyMioframeSpace':
      return 'Создайте или импортируйте документ — Mioframe добавит сюда служебные файлы для хранения.';
    default:
      return undefined;
  }
});
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
        :errors="recoveryErrors"
      >
        <template #actions>
          <MDButton
            label="Retry Authorization"
            :loading="isRetryAuthorizationLoading"
            @click="onRetryAuthorization"
          />

          <MDButton label="Return Home" color="text" @click="onReturnHomeClick" />
        </template>
      </GoogleDriveAccessRecoveryState>

      <MDEmptyState
        v-else-if="errorMessage"
        class="repository-explorer-widget__error"
        :headline="errorHeadline"
        :supporting-text="errorMessage"
      >
        <template #icon>
          <MDSymbol name="error" class="repository-explorer-widget__error-icon" />
        </template>
      </MDEmptyState>

      <div v-else class="repository-explorer-widget__content">
        <section
          class="repository-explorer-widget__section"
          aria-labelledby="mioframe-documents-title"
        >
          <div class="repository-explorer-widget__section-header">
            <div class="repository-explorer-widget__section-copy">
              <h2 id="mioframe-documents-title" class="repository-explorer-widget__section-title">
                Документы Mioframe
              </h2>
            </div>

            <MDIconButton
              tooltip="Как хранятся документы"
              md-symbol-name="info"
              @click="onOpenStorageInfoSheet"
            />
          </div>

          <MDListContainer is="div" class="repository-explorer-widget__content-list">
            <CFRDocumentMDListItem
              is="button"
              v-for="docId in documentIds"
              :key="docId"
              :document-id="docId"
              :path="directoryPath"
              class="repository-explorer-widget__list-item"
              @click="() => onClickDocument(docId)"
            >
              <template #trailingIcon>
                <DocumentManageMenuButton :directory-path="directoryPath" :document-id="docId" />
              </template>
            </CFRDocumentMDListItem>
          </MDListContainer>

          <MDEmptyState
            v-if="documentEmptyHeadline"
            class="repository-explorer-widget__empty-state"
            :headline="documentEmptyHeadline"
            :supporting-text="documentEmptySupportingText ?? ''"
          >
            <template #icon>
              <MDSymbol name="edit_document" />
            </template>
          </MDEmptyState>
        </section>

        <section class="repository-explorer-widget__section" aria-labelledby="mioframe-files-title">
          <div class="repository-explorer-widget__section-copy">
            <h2 id="mioframe-files-title" class="repository-explorer-widget__section-title">
              Файлы
            </h2>
            <p class="repository-explorer-widget__section-supporting-text">
              Обычные файлы и папки · служебные скрыты
            </p>
          </div>

          <MDListContainer is="div" class="repository-explorer-widget__content-list">
            <FSEntryMDListItem
              v-for="[name, { description, type: nodeType }] in presentation.visibleFileEntries"
              :key="name"
              is-button
              :name="name"
              :supporting-text="description"
              :type="nodeType"
              class="repository-explorer-widget__list-item"
              @click="() => onClickDirectoryEntry(name, nodeType)"
            >
              <template #trailingIcon>
                <FSEntryManageMenuButton :path="PathUtils.join(directoryPath, name)" />
              </template>
            </FSEntryMDListItem>
          </MDListContainer>
        </section>
      </div>

      <slot name="after" />
    </div>

    <MioframeStorageInfoSheet v-if="showStorageInfoSheet" @close="onCloseStorageInfoSheet" />
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

  &__section {
    display: grid;
    gap: 8px;
  }

  &__section-header,
  &__section-copy {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    justify-content: space-between;
    padding: 0 16px;
  }

  &__section-copy {
    display: grid;
    justify-content: initial;
  }

  &__section-title {
    margin: 0;
    font-family: var(--md-sys-typescale-title-medium-font);
    font-size: var(--md-sys-typescale-title-medium-size);
    font-weight: var(--md-sys-typescale-title-medium-weight);
    line-height: var(--md-sys-typescale-title-medium-line-height);
    letter-spacing: var(--md-sys-typescale-title-medium-tracking);
  }

  &__section-supporting-text {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-small-font);
    font-size: var(--md-sys-typescale-body-small-size);
    font-weight: var(--md-sys-typescale-body-small-weight);
    line-height: var(--md-sys-typescale-body-small-line-height);
    letter-spacing: var(--md-sys-typescale-body-small-tracking);
  }

  &__content-list {
    flex: 1 0;
  }

  &__list-item {
    --md-list-item-border-radius: 8px;
  }

  &__empty-state {
    padding: 0 16px;
  }

  &__error-icon {
    --md-content-color: var(--md-sys-color-error);
  }
}
</style>
