<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import type { DocumentFolder } from '../../shared/lib/cfrDocument';
import { createDocumentFolder } from '../../shared/lib/cfrDocument';
import { createLocalDirectory } from '../../shared/lib/localFileSystem';
import type { DocumentId } from '@automerge/automerge-repo/';
import { putObject } from '../../shared/lib/changeObject/putObject';
import { createLogger } from '../../shared/lib/logger';
import { uniqueId } from 'lodash-es';
import { useCFRDocument } from '../document/useCFRDocument';
import { useDocumentFolder } from '../folder/useDocumentFolder';

/**
 * Прочесть Database в виде json
 */

const log = createLogger('JSONDatabaseView');

const fsDirectoryHandle = shallowRef<FileSystemDirectoryHandle>();

const documentFolder = computed((): DocumentFolder | undefined =>
  fsDirectoryHandle.value
    ? createDocumentFolder(createLocalDirectory(fsDirectoryHandle.value))
    : undefined,
);

const { content: documentsMap, createDocument } = useDocumentFolder(documentFolder);

const onCLickChooseDirectory = async () => {
  fsDirectoryHandle.value = await window.showDirectoryPicker();
};

const onClickCreateDocument = () => {
  void createDocument({
    name: uniqueId('name'),
    type: 'test',
  });
};

const selectedDocumentId = ref<DocumentId>();

const selectedCFRDocument = computed(() =>
  selectedDocumentId.value
    ? documentsMap.value.get(selectedDocumentId.value)
    : undefined,
);

const { doc: selectedDocumentContent, change: changeDocument } =
  useCFRDocument(selectedCFRDocument);

const onClickChangeDoc = () => {
  changeDocument((doc) => {
    putObject(doc, {
      body: {
        uniqId: uniqueId(),
      },
    });

    log.debug('changed doc', doc);
  });
};

// todo: сделать компонент просмотра и редактирования документа с json редактором
</script>

<template>
  <div class="block-spacing is-flex is-flex-direction-column">
    <button type="button" class="button" @click="onCLickChooseDirectory">
      choose directory
    </button>

    <button type="button" class="button" @click="onClickCreateDocument">
      create document
    </button>

    <button type="button" class="button" @click="onClickChangeDoc">
      Change Doc
    </button>

    <select v-model="selectedDocumentId" class="select">
      <option v-for="[id] in documentsMap" :key="id" :value="id">
        {{ id }}
      </option>
    </select>

    <pre>
        {{ selectedDocumentContent }}
    </pre>
  </div>
</template>
