<script setup lang="ts">
import { FSEntryMDListItem } from '@entity/fsEntry';
import { useEntryManageAvailability } from '@feature/entryManage';
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import { computed, toRef } from 'vue';
import RepositoryExplorerEntryManageButton from './RepositoryExplorerEntryManageButton.vue';

const props = defineProps<{
  directoryPath: string;
  name: string;
  description?: string | undefined;
  entryType: FSNodeType;
}>();

const emit = defineEmits<{
  click: [name: string];
}>();

const entryPath = computed(() => PathUtils.join(props.directoryPath, props.name));
const showDocumentActions = computed(() => props.entryType === FSNodeType.Directory);

const { hasActions } = useEntryManageAvailability(
  entryPath,
  toRef(props, 'entryType'),
  showDocumentActions,
);

const onClickEntry = (name: string) => {
  emit('click', name);
};
</script>

<template>
  <FSEntryMDListItem
    :is-button="entryType === FSNodeType.Directory"
    :name="name"
    :supporting-text="description"
    :type="entryType"
    class="repository-explorer-file-list-item"
    @click="onClickEntry"
  >
    <template v-if="hasActions" #trailingIcon>
      <RepositoryExplorerEntryManageButton
        :path="entryPath"
        :entry-type="entryType"
        :show-document-actions="showDocumentActions"
      />
    </template>
  </FSEntryMDListItem>
</template>
