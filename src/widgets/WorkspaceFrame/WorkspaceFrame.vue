<script setup lang="ts">
import { computed, ref, toRef, watchEffect } from 'vue';
import type { DocumentApi } from '../../shared/lib/documentApi';
import { useDocument } from '../../entities/document/useDocument';
import { createLogModule } from '../../shared/lib/logger';
import { DocumentEditForm } from '../../features/documentEdit';
import DatabaseView from '../../entities/database/DatabaseView.vue';
import { zodDatabaseDocument } from '../../shared/lib/databaseDocument/types';
import { is } from '../../shared/lib/validateZodScheme';

const { debug } = createLogModule('WorkspaceFarame');

const props = defineProps<{
  documentApi: DocumentApi;
}>();

defineSlots<{
  default(p: { documentApi: DocumentApi; documentType: string }): unknown;
}>();

const documentApi = toRef(() => props.documentApi);

const { doc, cahnge } = useDocument(documentApi);

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

const databaseDocumentState = computed(() =>
  is(doc.value, zodDatabaseDocument) ? doc.value.body : undefined,
);
</script>

<template>
  <div class="is-flex is-flex-direction-column is-flex-grow-1">
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

    <slot :document-api :document-type>
      <DatabaseView
        v-if="databaseDocumentState"
        :database-state="databaseDocumentState"
      />

      <DocumentEditForm
        v-else
        :document-api
        class="is-flex is-flex-direction-column is-flex-grow-1"
      />
    </slot>
  </div>
</template>
