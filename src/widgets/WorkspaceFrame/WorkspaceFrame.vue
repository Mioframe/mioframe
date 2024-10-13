<script setup lang="ts">
import { computed, ref, toRef, watchEffect } from 'vue';
import type { CFRDocument } from '../../shared/lib/cfrDocument';
import { useCFRDocument } from '../../entities/document/useCFRDocument';
import { createLogger } from '../../shared/lib/logger';
import { DocumentEditForm } from '../../features/documentEdit';
import {
  DATABASE_DOCUMENT_TYPE,
  createDatabaseDocument,
} from '../../shared/lib/databaseDocument';
import DatabaseWidget from './DatabaseWidget.vue';

const { debug } = createLogger('WorkspaceFarame');

const props = defineProps<{
  cfrDocument: CFRDocument;
}>();

defineSlots<{
  default(p: { cfrDocument: CFRDocument; documentType: string }): unknown;
}>();

const cfrDocument = toRef(() => props.cfrDocument);

const { doc, cahnge } = useCFRDocument(cfrDocument);

const stateName = ref<string>();

const documentName = computed(() => doc.value?.name);

watchEffect(() => {
  debug('watchEffect');
  stateName.value = documentName.value;
});

const onChangeName = () => {
  debug('onChangeName');
  cahnge((doc) => {
    if (stateName.value && stateName.value !== doc.name) {
      doc.name = stateName.value;
    }
  });
};

const documentType = computed(() => doc.value?.type ?? 'unknown');

const databaseDocument = computed(() =>
  documentType.value === DATABASE_DOCUMENT_TYPE
    ? createDatabaseDocument(cfrDocument.value)
    : undefined,
);
</script>

<template>
  <div class="is-flex is-flex-direction-column is-flex-grow-1 is-overflow-auto">
    <form class="" @submit.prevent>
      <section class="is-flex is-align-items-center is-gap-1">
        <div class="field is-flex-grow-1">
          <div class="control">
            <input
              v-model="stateName"
              class="input"
              type="text"
              placeholder="name"
              required
              @change="onChangeName"
            />
          </div>
        </div>

        <span class="tag is-light is-medium"> {{ documentType }} </span>
      </section>
    </form>

    <slot :cfr-document :document-type>
      <DatabaseWidget
        v-if="databaseDocument"
        :database-document="databaseDocument"
      />

      <DocumentEditForm
        v-else
        :cfr-document
        class="is-flex is-flex-direction-column is-flex-grow-1"
      />
    </slot>
  </div>
</template>
