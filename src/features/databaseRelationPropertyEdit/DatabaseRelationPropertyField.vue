<script setup lang="ts">
import type { Relation } from '@entity/databaseRelation';
import { useRepository } from '@entity/repository';
import { MDSelectBase } from '@shared/ui/Select';
import { computed, toRefs } from 'vue';
import DatabaseDocumentSelectOption from './DatabaseDocumentSelectOption.vue';

const props = defineProps<{
  path: string;
}>();

const { path } = toRefs(props);

const relationModel = defineModel<Relation>();

const { documentList: documentIdList } = useRepository(path);

const modelSelectedDocumentId = computed({
  get: () =>
    relationModel.value?.documentId ? [relationModel.value.documentId] : [],
  set: ([documentId]) => {
    relationModel.value = {
      ...relationModel.value,
      documentId,
    };
  },
});
</script>

<template>
  <MDSelectBase
    v-model:model-value="modelSelectedDocumentId"
    label-text="Database Document"
  >
    <template #options>
      <DatabaseDocumentSelectOption
        v-for="documentId in documentIdList"
        :key="documentId"
        :path="path"
        :document-id="documentId"
      />
    </template>
  </MDSelectBase>
</template>
