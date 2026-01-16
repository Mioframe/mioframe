<script setup lang="ts">
import type { Relation } from '@entity/databaseRelation';
import { useRepository } from '@entity/repository';
import { MDSelectBase } from '@shared/ui/Select';
import { computed, toRefs } from 'vue';
import { DatabaseDocumentSelectOption, useDocument } from '@entity/cfrDocument';

const props = defineProps<{
  path: string;
}>();

const { path } = toRefs(props);

const relationModel = defineModel<Relation>();

const relationDocumentId = computed(() => relationModel.value?.documentId);

const { state: documentIdList } = useRepository(path);

const modelSelectedDocumentId = computed({
  get: () => (relationDocumentId.value ? [relationDocumentId.value] : []),
  set: ([documentId]) => {
    if (documentId) {
      relationModel.value = {
        ...relationModel.value,
        documentId,
      };
    }
  },
});

const { state: relationDocument } = useDocument(path, relationDocumentId);

const relationDocumentName = computed(() => relationDocument.value?.name);
</script>

<template>
  <MDSelectBase
    v-model:model-value="modelSelectedDocumentId"
    label-text="Database Document"
  >
    <template #valueContainer>
      <span>
        {{ relationDocumentName }}
      </span>
    </template>

    <template v-if="documentIdList?.length" #options>
      <DatabaseDocumentSelectOption
        v-for="documentId in documentIdList"
        :key="documentId"
        :path="path"
        :document-id="documentId"
      />
    </template>
  </MDSelectBase>
</template>
