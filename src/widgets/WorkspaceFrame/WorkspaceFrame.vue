<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { CFRDocument } from '../../shared/lib/cfrDocument';
import { useCFRDocument } from '../../entities/document/useCFRDocument';
import { createLogger } from '../../shared/lib/logger';
import { DocumentEditForm } from '../../features/documentEdit';
import {
  DATABASE_DOCUMENT_TYPE,
  createDatabaseDocument,
} from '../../shared/lib/databaseDocument';
import DatabaseWidget from './DatabaseWidget.vue';
import ValueWidgetInline from '@widget/ValueWidgetInline/ValueWidgetInline.vue';
import { PROPERTY_TYPE_STRING } from '@entity/stringProperty';
import { isString } from 'lodash-es';

const { debug } = createLogger('WorkspaceFarame');

const props = defineProps<{
  cfrDocument: CFRDocument;
}>();

defineSlots<{
  default(p: { cfrDocument: CFRDocument; documentType: string }): unknown;
}>();

const cfrDocument = toRef(() => props.cfrDocument);

const { doc, cahnge } = useCFRDocument(cfrDocument);

const documentName = computed(() => doc.value?.name);

const onChangeName = (v: unknown) => {
  debug('onChangeName');
  if (isString(v)) {
    cahnge((doc) => {
      if (v !== doc.name) {
        doc.name = v;
      }
    });
  }
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
      <section class="is-flex is-align-items-center p-2">
        <ValueWidgetInline
          class="is-size-1 is-flex-grow-1"
          editable
          :value="documentName"
          :property="{
            name: 'Document name',
            type: PROPERTY_TYPE_STRING,
          }"
          @update:value="onChangeName"
        />

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
