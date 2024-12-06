<script setup lang="ts">
import { computed, toRef } from 'vue';
import type { CFRDocument } from '../../shared/lib/cfrDocument';
import type { ReactiveCFRDocument } from '../../entities/document/createReactiveCFRDocument';
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
  reactiveCFRDocument: ReactiveCFRDocument;
}>();

defineSlots<{
  default(props: { cfrDocument: CFRDocument; documentType: string }): unknown;
}>();

const selectedViewId = defineModel<ViewId>('selectedViewId');

const reactiveCFRDocument = toRef(() => props.reactiveCFRDocument);

const documentName = computed(() => reactiveCFRDocument.value.doc?.name);

// todo: вынести в feature
const onChangeName = (v: unknown) => {
  debug('onChangeName');
  if (isString(v)) {
    reactiveCFRDocument.value.change((doc) => {
      if (v !== doc.name) {
        doc.name = v;
      }
    });
  }
};

const documentType = computed(
  () => reactiveCFRDocument.value.doc?.type ?? 'unknown',
);

const selectedDatabaseDocument = computed(() =>
  reactiveCFRDocument.value.doc?.type === DATABASE_DOCUMENT_TYPE
    ? createDatabaseDocument(reactiveCFRDocument)
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

    <slot :reactive-c-f-r-document :document-type>
      <!-- todo: тут определяются виджеты документов по их типу -->
      <DatabaseWidget
        v-if="selectedDatabaseDocument"
        :database-document="selectedDatabaseDocument"
        :selected-view-id
      />

      <DocumentEditForm
        v-else
        :reactive-cfr-document="reactiveCFRDocument"
        class="is-flex is-flex-direction-column is-flex-grow-1"
      />
    </slot>
  </div>
</template>
