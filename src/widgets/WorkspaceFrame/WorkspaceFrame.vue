<script setup lang="ts">
import { computed, ref, toRef, watchEffect } from 'vue';
import type { CFRDocument } from '../../shared/lib/cfrDocument';
import { useCFRDocument } from '../../entities/document/useCFRDocument';
import { createLogger } from '../../shared/lib/logger';
import { DocumentEditForm } from '../../features/documentEdit';
import DatabaseView from '../../entities/database/DatabaseView.vue';
import {
  DATABASE_DOCUMENT_TYPE,
  zodDatabaseDocumentContent,
} from '../../shared/lib/databaseDocument/types';
import { is } from '../../shared/lib/validateZodScheme';
import ValueBooleanInline from '../../entities/value/ValueBooleanInline.vue';
import {
  PROPERTY_TYPE_BOOLEAN,
  PROPERTY_TYPE_NUMBER,
  PROPERTY_TYPE_STRING,
} from '../../shared/lib/databaseDocument';
import { ValueNumberInline, ValueStringInline } from '../../entities/value';
import { ContextBtn } from '../../shared/ui/ContextButton';
import type { MenuItem } from '../../shared/ui/ContextButton/ContextButton.vue';
import { ModalCard } from '../../shared/ui/ModalCard';
import { DbItemRemoveForm } from '../../features/databaseItemRemove';
import { createDatabaseApi } from '../../shared/lib/databaseDocument/createDatabaseApi';
import type { ItemId } from '../../shared/lib/databaseDocument/item';

const { debug } = createLogger('WorkspaceFarame');

const props = defineProps<{
  documentApi: CFRDocument;
}>();

defineSlots<{
  default(p: { documentApi: CFRDocument; documentType: string }): unknown;
}>();

const documentApi = toRef(() => props.documentApi);

const { doc, cahnge } = useCFRDocument(documentApi);

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

const databaseApi = computed(() =>
  documentType.value === DATABASE_DOCUMENT_TYPE
    ? createDatabaseApi(documentApi.value)
    : undefined,
);

const databaseDocumentState = computed(() =>
  is(doc.value, zodDatabaseDocumentContent) ? doc.value.body : undefined,
);

enum ItemEvents {
  delete,
}

const contextItemMenu: MenuItem<ItemEvents>[] = [
  { eventName: ItemEvents.delete, label: 'delete' },
];

const itemIdToRemove = ref<ItemId>();

const onClickContextItem = (eventName: ItemEvents, itemId: ItemId) => {
  switch (eventName) {
    case ItemEvents.delete:
      itemIdToRemove.value = itemId;
      break;

    default:
      break;
  }
};
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

    <slot :document-api :document-type>
      <DatabaseView
        v-if="databaseDocumentState"
        :database-state="databaseDocumentState"
      >
        <template #value="{ property, value }">
          <ValueBooleanInline
            v-if="property?.type === PROPERTY_TYPE_BOOLEAN"
            :value
          />

          <ValueNumberInline
            v-else-if="property?.type === PROPERTY_TYPE_NUMBER"
            :value
          />

          <ValueStringInline
            v-else-if="property?.type === PROPERTY_TYPE_STRING"
            :value
          />
        </template>

        <template #itemActions="{ itemId }">
          <ContextBtn
            class="is-small"
            :menu="contextItemMenu"
            @click="onClickContextItem($event, itemId)"
          >
            <template #[ItemEvents.delete]>
              <i class="fa-solid fa-eraser" />
            </template>
          </ContextBtn>
        </template>
      </DatabaseView>

      <DocumentEditForm
        v-else
        :document-api
        class="is-flex is-flex-direction-column is-flex-grow-1"
      />
    </slot>

    <ModalCard v-if="databaseApi && itemIdToRemove">
      <DbItemRemoveForm
        :database-api="databaseApi"
        :item-id="itemIdToRemove"
        @cancel="itemIdToRemove = undefined"
        @removed="itemIdToRemove = undefined"
      />
    </ModalCard>
  </div>
</template>
