<script setup lang="ts">
import { FSEntryMDListItem } from '@entity/fsEntry';
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import { MDListContainer } from '@shared/ui/Lists';
import type { MioframeDirectoryEntry } from '@entity/mioframeSpaceDirectory';
import { computed } from 'vue';
import RepositoryExplorerEntryManageButton from './RepositoryExplorerEntryManageButton.vue';

const props = defineProps<{
  directoryPath: string;
  hideAutomergeFiles: boolean;
  visibleFileEntries: readonly MioframeDirectoryEntry[];
}>();

const emit = defineEmits<{
  selectPath: [path: string];
}>();

const hasVisibleFiles = computed(() => props.visibleFileEntries.length > 0);

const onClickDirectoryEntry = (name: string, fileType: FSNodeType) => {
  if (fileType === FSNodeType.Directory) {
    emit('selectPath', PathUtils.join(props.directoryPath, name));
  }
};

const visibleEntryClickHandlers = computed(() =>
  Object.fromEntries(
    props.visibleFileEntries.map(([name, { type: fileType }]) => [
      name,
      () => {
        onClickDirectoryEntry(name, fileType);
      },
    ]),
  ),
);

const supportingText = computed(() =>
  props.hideAutomergeFiles
    ? 'Regular files and folders. Mioframe service files are hidden.'
    : 'Regular files, folders, and Mioframe document files.',
);

const emptyText = computed(() =>
  props.hideAutomergeFiles
    ? 'No regular files or folders to show. Mioframe service files are hidden.'
    : 'No regular files, folders, or Mioframe document files to show.',
);
</script>

<template>
  <section class="repository-explorer-section" aria-labelledby="mioframe-files-title">
    <div class="repository-explorer-section__copy">
      <h2 id="mioframe-files-title" class="repository-explorer-section__title">Files</h2>
      <p class="repository-explorer-section__supporting-text">{{ supportingText }}</p>
    </div>

    <MDListContainer is="div" v-if="hasVisibleFiles" class="repository-explorer-section__list">
      <FSEntryMDListItem
        v-for="[name, { description, type: nodeType }] in visibleFileEntries"
        :key="name"
        is-button
        :name="name"
        :supporting-text="description"
        :type="nodeType"
        class="repository-explorer-section__list-item"
        @click="visibleEntryClickHandlers[name]"
      >
        <template #trailingIcon>
          <RepositoryExplorerEntryManageButton
            :path="PathUtils.join(directoryPath, name)"
            :entry-type="nodeType"
            :show-document-actions="nodeType === FSNodeType.Directory"
          />
        </template>
      </FSEntryMDListItem>
    </MDListContainer>

    <p v-else class="repository-explorer-section__empty-text">{{ emptyText }}</p>
  </section>
</template>

<style scoped>
.repository-explorer-section {
  display: grid;
  gap: 8px;

  &__copy {
    display: grid;
    gap: 4px;
    padding: 0 16px;
  }

  &__title {
    margin: 0;
    font-family: var(--md-sys-typescale-title-medium-font);
    font-size: var(--md-sys-typescale-title-medium-size);
    font-weight: var(--md-sys-typescale-title-medium-weight);
    line-height: var(--md-sys-typescale-title-medium-line-height);
    letter-spacing: var(--md-sys-typescale-title-medium-tracking);
  }

  &__supporting-text {
    margin: 0;
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-small-font);
    font-size: var(--md-sys-typescale-body-small-size);
    font-weight: var(--md-sys-typescale-body-small-weight);
    line-height: var(--md-sys-typescale-body-small-line-height);
    letter-spacing: var(--md-sys-typescale-body-small-tracking);
  }

  &__list {
    flex: 1 0;
  }

  &__list-item {
    --md-list-item-border-radius: 8px;
  }

  &__empty-text {
    margin: 0;
    padding: 0 16px;
    color: var(--md-sys-color-on-surface-variant);
    font-family: var(--md-sys-typescale-body-small-font);
    font-size: var(--md-sys-typescale-body-small-size);
    font-weight: var(--md-sys-typescale-body-small-weight);
    line-height: var(--md-sys-typescale-body-small-line-height);
    letter-spacing: var(--md-sys-typescale-body-small-tracking);
  }
}
</style>
