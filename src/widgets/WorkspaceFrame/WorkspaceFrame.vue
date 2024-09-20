<script setup lang="ts">
import { computed, ref, toRef, watchEffect } from 'vue';
import type { DocumentApi } from '../../shared/lib/documentApi';
import { useDocument } from '../../entities/database/useDocument';
import { createLogModule } from '../../shared/lib/logger';

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
</script>

<template>
  <div class="is-flex is-flex-direction-column is-flex-grow-1">
    <form class="is-flex" @submit.prevent>
      <div class="field">
        <label class="label">Name</label>

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

      <span class="tag is-light"> {{ documentType }} </span>
    </form>

    <slot :document-api :document-type>
      <pre>{{ doc }}</pre>
      TODO: добавить json редактор по умолчанию json-editor-vue
    </slot>
  </div>
</template>
