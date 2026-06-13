<script setup lang="ts">
import { FSNodeType, PathUtils, type FSNodeStat } from '@shared/lib/virtualFileSystem';
import { MDList } from '@shared/ui/Lists';
import { computed } from 'vue';
import RepositoryExplorerFileListItem from './RepositoryExplorerFileListItem.vue';

type RepositoryExplorerFileEntry = readonly [name: string, stat: FSNodeStat];

const props = defineProps<{
  directoryPath: string;
  hideAutomergeFiles: boolean;
  regularFileEntries: readonly RepositoryExplorerFileEntry[];
}>();

const emit = defineEmits<{
  selectPath: [path: string];
  selectJsonFile: [path: string];
}>();

const hasRegularFiles = computed(() => props.regularFileEntries.length > 0);

const isJsonFileEntry = (name: string, type: FSNodeType) =>
  type === FSNodeType.File && name.toLowerCase().endsWith('.json');

const onClickEntry = (name: string, type: FSNodeType) => {
  if (type === FSNodeType.Directory) {
    emit('selectPath', PathUtils.join(props.directoryPath, name));
    return;
  }

  if (isJsonFileEntry(name, type)) {
    emit('selectJsonFile', PathUtils.join(props.directoryPath, name));
  }
};

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
  <section class="repository-explorer-files-section" aria-labelledby="mioframe-files-title">
    <div class="repository-explorer-files-section__copy">
      <h2 id="mioframe-files-title" class="repository-explorer-files-section__title">Files</h2>
      <p class="repository-explorer-files-section__supporting-text">{{ supportingText }}</p>
    </div>

    <MDList
      v-if="hasRegularFiles"
      variant="expressive"
      list-style="segmented"
      class="repository-explorer-files-section__list"
    >
      <RepositoryExplorerFileListItem
        v-for="[name, { description, type: nodeType, capabilities }] in regularFileEntries"
        :key="PathUtils.join(directoryPath, name)"
        :directory-path="directoryPath"
        :name="name"
        :description="description"
        :entry-type="nodeType"
        :can-edit-children="capabilities?.canEditChildren"
        :can-change-path="capabilities?.canChangePath"
        :can-delete="capabilities?.canDelete"
        class="repository-explorer-files-section__list-item"
        @click="(clickedName) => onClickEntry(clickedName, nodeType)"
      />
    </MDList>

    <p v-else class="repository-explorer-files-section__empty-text">{{ emptyText }}</p>
  </section>
</template>

<style scoped>
.repository-explorer-files-section {
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
