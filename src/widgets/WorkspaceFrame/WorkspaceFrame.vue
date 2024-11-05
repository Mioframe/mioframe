<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { CFRDocument } from '../../shared/lib/cfrDocument';
import { useCFRDocument } from '../../entities/document/useCFRDocument';
import { createLogger } from '../../shared/lib/logger';
import { DocumentEditForm } from '../../features/documentEdit';
import type { ViewId } from '../../shared/lib/databaseDocument';
import {
  DATABASE_DOCUMENT_TYPE,
  createDatabaseDocument,
} from '../../shared/lib/databaseDocument';
import DatabaseWidget from './DatabaseWidget.vue';
import ValueWidgetInline from '@widget/ValueWidgetInline/ValueWidgetInline.vue';
import { PROPERTY_TYPE_STRING } from '@entity/stringProperty';
import { isString } from 'lodash-es';

const { debug } = createLogger('WorkspaceFrame');

const props = defineProps<{
  cfrDocument: CFRDocument;
}>();

defineSlots<{
  default(props: { cfrDocument: CFRDocument; documentType: string }): unknown;
}>();

const selectedViewId = defineModel<ViewId>('selectedViewId');

const cfrDocument = toRef(() => props.cfrDocument);

const { doc, change } = useCFRDocument(cfrDocument);

const documentName = computed(() => doc.value?.name);

// todo: вынести в feature
const onChangeName = (v: unknown) => {
  debug('onChangeName');
  if (isString(v)) {
    change((doc) => {
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
    <section class="is-flex is-align-items-center p-2">
      <ValueWidgetInline
        class="title is-flex-grow-1"
        editable
        :value="documentName"
        :property="{
          name: 'Document name',
          type: PROPERTY_TYPE_STRING,
        }"
        @update:value="onChangeName"
      />

      <span class="tag is-medium"> {{ documentType }} </span>
    </section>

    <slot :cfr-document :document-type>
      <!-- todo: тут определяются виджеты документов по их типу -->
      <DatabaseWidget
        v-if="databaseDocument"
        :database-document="databaseDocument"
        :selected-view-id
      />

      <DocumentEditForm
        v-else
        :cfr-document
        class="is-flex is-flex-direction-column is-flex-grow-1"
      />
    </slot>
  </div>
</template>
