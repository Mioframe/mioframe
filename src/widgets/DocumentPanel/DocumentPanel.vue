<script setup lang="ts">
import { ModalCard } from '../../shared/ui/ModalCard';
import { DbPropertyCreateForm } from '../../features/databasePropertyCreate';
import { computed, ref, toRef } from 'vue';
import type { CFRDocument } from '../../shared/lib/cfrDocument';
import { useCFRDocument } from '../../entities/document';
import type { Item } from '../../shared/lib/databaseDocument';
import { DATABASE_DOCUMENT_TYPE } from '../../shared/lib/databaseDocument';
import { DbPropertyRemoveForm } from '../../features/databasePropertyRemove';
import { DbItemAdd } from '../../features/databaseItemAdd';
import { PropertyStingField } from '../../features/propertyStringEdit';
import { useDatabaseDocument } from '../../entities/database/useDatabaseDocument';
import { createDatabaseDocument } from '../../shared/lib/databaseDocument/createDatabaseDocument';
import { PropertyNumberField } from '../../features/propertyNumberEdit';
import { PropertyBooleanField } from '../../features/propertyBooleanEdit';

const props = defineProps<{
  cfrDocument: CFRDocument;
}>();

const cfrDocument = toRef(() => props.cfrDocument);

const { doc } = useCFRDocument(cfrDocument);

const databaseDocument = computed(() =>
  doc.value?.type === DATABASE_DOCUMENT_TYPE
    ? createDatabaseDocument(props.cfrDocument)
    : undefined,
);

const { properties: databaseProperies } = useDatabaseDocument(databaseDocument);

const documentType = computed(() => doc.value?.type);

const isShowPropertyCreate = ref(false);

const hasAddProperty = computed(
  () => documentType.value === DATABASE_DOCUMENT_TYPE,
);

const hasRemoveProperty = computed(
  () => databaseProperies.value && Object.keys(databaseProperies.value).length,
);

const isShowPropertyRemove = ref(false);

const isShowItemAdd = ref(false);

const hasItemAdd = computed(
  () => databaseProperies.value && Object.keys(databaseProperies.value).length,
);

const onAddItem = () => {
  databaseDocument.value?.addItem(stateNewItem.value);
  isShowItemAdd.value = false;
};

const onCancelAddItem = () => {
  isShowItemAdd.value = false;
};

const stateNewItem = ref<Item>({});
</script>

<template>
  <form class="document-panel">
    <div class="tabs is-fullwidth">
      <ul>
        <li v-if="hasItemAdd">
          <a @click="isShowItemAdd = true">
            <span class="icon is-small"><i class="fas fa-plus" /></span>

            <span>Add Item</span>
          </a>
        </li>

        <li v-if="hasAddProperty">
          <a @click="isShowPropertyCreate = true">
            <span class="icon is-small"><i class="fas fa-square-plus" /></span>

            <span>Add Property</span>
          </a>
        </li>

        <li v-if="hasRemoveProperty">
          <a @click="isShowPropertyRemove = true">
            <span class="icon is-small"><i class="fas fa-trash" /></span>

            <span>Remove Property</span>
          </a>
        </li>
      </ul>
    </div>

    <ModalCard v-if="isShowPropertyCreate">
      <DbPropertyCreateForm
        :cfr-document="cfrDocument"
        @canceled="isShowPropertyCreate = false"
        @created="isShowPropertyCreate = false"
      />
    </ModalCard>

    <ModalCard v-if="isShowPropertyRemove">
      <DbPropertyRemoveForm
        :cfr-document="cfrDocument"
        @canceled="isShowPropertyRemove = false"
        @removed="isShowPropertyRemove = false"
      />
    </ModalCard>

    <ModalCard v-if="isShowItemAdd && databaseProperies">
      <DbItemAdd
        :properties="databaseProperies"
        @submit="onAddItem"
        @cancel="onCancelAddItem"
      >
        <template #string="{ property, propertyId }">
          <PropertyStingField
            v-model:value="stateNewItem[propertyId]"
            :label="property.name"
          />
        </template>

        <template #number="{ property, propertyId }">
          <PropertyNumberField
            v-model:value="stateNewItem[propertyId]"
            :label="property.name"
          />
        </template>

        <template #boolean="{ property, propertyId }">
          <PropertyBooleanField
            v-model:value="stateNewItem[propertyId]"
            :label="property.name"
          />
        </template>
      </DbItemAdd>
    </ModalCard>
  </form>
</template>
