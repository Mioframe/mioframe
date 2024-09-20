<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue';
import type { FolderApi } from '../../shared/lib/documentApi';
import { createFolderApi } from '../../shared/lib/documentApi';
import { type DataBaseStateLatest } from '../../shared/lib/databaseDocument/model';
import { createDirectoryEntryApi } from '../../shared/lib/fileSystemApi';
import type { DocumentId } from '@automerge/automerge-repo';
import { putObject } from '../../shared/lib/putObject';
import { createLogModule } from '../../shared/lib/logger';
import { uniqueId } from 'lodash-es';
import { useDocument } from './useDocument';
import { useFolder } from './temp';

/**
 * Прочесть Database в виде json
 */

const log = createLogModule('JSONDatabaseView');

const databaseJSON = ref<DataBaseStateLatest>();

const fsDirectoryHandle = shallowRef<FileSystemDirectoryHandle>();

const folderApi = computed((): FolderApi | undefined =>
  fsDirectoryHandle.value
    ? createFolderApi(createDirectoryEntryApi(fsDirectoryHandle.value))
    : undefined,
);

const { content: documentsMap, createDocument } = useFolder(folderApi);

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

const selectedDocumentApi = computed(() =>
  selectedDocumentId.value
    ? documentsMap.value.get(selectedDocumentId.value)
    : undefined,
);

const { doc: selectedDocument, cahnge: changeDocument } =
  useDocument(selectedDocumentApi);

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
        {{ selectedDocument }}
    </pre>
  </div>
</template>
