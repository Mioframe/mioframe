<script setup lang="ts">
import { TreeIterable } from '@shared/ui/TreeMenu';
import type { DocumentId } from '@automerge/automerge-repo';
import type { Collection } from '@shared/ui/TreeMenu/useIterable';
import type { ReactiveCFRDocument } from '@entity/document/createReactiveCFRDocument';
import { UIButton } from '@shared/ui/Button';
import { computed } from 'vue';
import { from } from 'ix/Ix.asynciterable';
import { filter } from 'ix/Ix.asynciterable.operators';
import type { RefRepo } from '@shared/lib/cfrDocument';
import { zodDocumentId } from '@shared/lib/fsStorageAdapter';
import { is } from '@shared/lib/validateZodScheme';

const { folderContents } = defineProps<{
  folderContents: Collection<
    [DocumentId, ReactiveCFRDocument] | [string, RefRepo]
  >;
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

const filteredContents = computed(
  (): Collection<[DocumentId, ReactiveCFRDocument]> =>
    from(folderContents).pipe(
      filter(
        (arg0): arg0 is [DocumentId, ReactiveCFRDocument] =>
          is(arg0[0], zodDocumentId) && 'doc' in arg0[1],
      ),
    ),
);
</script>

<template>
  <ul class="menu-list">
    <TreeIterable :collection="filteredContents" @click="onClickDocumentItem">
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
