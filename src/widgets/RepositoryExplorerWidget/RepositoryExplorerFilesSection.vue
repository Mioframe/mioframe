<script setup lang="ts">
import { FSEntryMDListItem } from '@entity/fsEntry';
import { FSNodeType, PathUtils, type FSNodeStat } from '@shared/lib/virtualFileSystem';
import { MDListContainer } from '@shared/ui/Lists';
import { computed } from 'vue';
import RepositoryExplorerEntryManageButton from './RepositoryExplorerEntryManageButton.vue';

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

const visibleDirectoryNames = computed(
  () =>
    new Set(
      props.regularFileEntries.flatMap(([name, { type }]) =>
        type === FSNodeType.Directory ? [name] : [],
      ),
    ),
);

const isDirectoryEntry = (name: string) => visibleDirectoryNames.value.has(name);

const isJsonFileEntry = (name: string, type: FSNodeType) =>
  type === FSNodeType.File && name.toLowerCase().endsWith('.json');

const isInteractiveEntry = (name: string, type: FSNodeType) =>
  isDirectoryEntry(name) || isJsonFileEntry(name, type);

const onClickEntry = (name: string) => {
  const entry = props.regularFileEntries.find(([entryName]) => entryName === name);

  if (!entry) {
    return;
  }

  const [, { type }] = entry;

  if (isDirectoryEntry(name)) {
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

    <MDListContainer
      is="div"
      v-if="hasRegularFiles"
      class="repository-explorer-files-section__list"
    >
      <FSEntryMDListItem
        v-for="[name, { description, type: nodeType }] in regularFileEntries"
        :key="name"
        :is-button="isInteractiveEntry(name, nodeType)"
        :name="name"
        :supporting-text="description"
        :type="nodeType"
        class="repository-explorer-files-section__list-item"
        @click="onClickEntry"
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
