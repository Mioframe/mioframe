<script setup lang="ts">
import { FSEntryMDListItem } from '@entity/fsEntry';
import { useFSEntryManageActions } from '@feature/entryManage';
import { FSNodeType, PathUtils } from '@shared/lib/virtualFileSystem';
import { computed, toRef } from 'vue';
import RepositoryExplorerEntryManageButton from './RepositoryExplorerEntryManageButton.vue';

const props = defineProps<{
  directoryPath: string;
  name: string;
  description?: string | undefined;
  entryType: FSNodeType;
  canEditChildren?: boolean | undefined;
  canChangePath?: boolean | undefined;
  canDelete?: boolean | undefined;
}>();

const emit = defineEmits<{
  click: [name: string];
}>();

const showDocumentActions = computed(() => props.entryType === FSNodeType.Directory);

const { hasActions } = useFSEntryManageActions({
  entryType: toRef(props, 'entryType'),
  canEditChildren: toRef(props, 'canEditChildren'),
  canChangePath: toRef(props, 'canChangePath'),
  canDelete: toRef(props, 'canDelete'),
  showDocumentActions,
});

const onClickEntry = (name: string) => {
  emit('click', name);
};
</script>

<template>
  <FSEntryMDListItem
    :is-button="
      entryType === FSNodeType.Directory ||
      (entryType === FSNodeType.File && name.toLowerCase().endsWith('.json'))
    "
    :name="name"
    :supporting-text="description"
    :type="entryType"
    class="repository-explorer-file-list-item"
    @click="onClickEntry"
  >
    <template v-if="hasActions" #trailingIcon>
      <RepositoryExplorerEntryManageButton
        :path="PathUtils.join(directoryPath, name)"
        :entry-type="entryType"
        :can-edit-children="canEditChildren"
        :can-change-path="canChangePath"
        :can-delete="canDelete"
        :show-document-actions="showDocumentActions"
      />
    </template>
  </FSEntryMDListItem>
</template>
