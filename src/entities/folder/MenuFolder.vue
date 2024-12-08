<script setup lang="ts">
import { TreeIterable } from '@shared/ui/TreeMenu';
import type { DocumentId } from '@automerge/automerge-repo';
import type { IterableCollection } from '@shared/ui/TreeMenu/useIterable';
import type { ReactiveCFRDocument } from '@entity/document/createReactiveCFRDocument';
import { UIButton } from '@shared/ui/Button';

defineProps<{
  folderContents: IterableCollection<DocumentId, ReactiveCFRDocument>;
}>();

defineSlots<{
  contextMenu(props: {
    documentId: DocumentId;
    documentName?: string;
  }): unknown;
}>();

const emit = defineEmits<{
  click: [documentId: DocumentId, reactiveCFRDocument: ReactiveCFRDocument];
}>();

const onClickDocumentItem = (
  documentId: DocumentId,
  reactiveCFRDocument: ReactiveCFRDocument,
) => {
  emit('click', documentId, reactiveCFRDocument);
};
</script>

<template>
  <ul class="menu-list">
    <TreeIterable :collection="folderContents" @click="onClickDocumentItem">
      <template #item="{ item, key }">
        <UIButton grow @click="onClickDocumentItem(key, item)">
          <template #icon>
            <i class="fa-solid fa-file" />
          </template>

          <span>
            {{ item.doc?.name }}
          </span>
        </UIButton>
      </template>

      <template #contextMenu="{ key, item }">
        <slot
          name="contextMenu"
          :document-id="key"
          :document-name="item.doc?.name"
        />
      </template>
    </TreeIterable>
  </ul>
</template>
