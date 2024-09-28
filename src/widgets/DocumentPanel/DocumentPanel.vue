<script setup lang="ts">
import { ModalCard } from '../../shared/ui/ModalCard';
import { DbPropertyCreateForm } from '../../features/databasePropertyCreate';
import { computed, ref, toRef } from 'vue';
import type { DocumentApi } from '../../shared/lib/documentApi';
import { useDocument } from '../../entities/document';
import type { Item } from '../../shared/lib/databaseDocument';
import { DATABASE_DOCUMENT_TYPE } from '../../shared/lib/databaseDocument';
import { DbPropertyRemoveForm } from '../../features/databasePropertyRemove';
import { DbItemAdd } from '../../features/databaseItemAdd';
import { PropertyStingField } from '../../features/propertyStringEdit';
import { useDatabaseDocument } from '../../entities/database/useDatabaseDocument';
import { createDatabaseApi } from '../../shared/lib/databaseDocument/createDatabaseApi';
import { PropertyNumberField } from '../../features/propertyNumberEdit';
import { PropertyBooleanField } from '../../features/propertyBooleanEdit';

const props = defineProps<{
  documentApi: DocumentApi;
}>();

const documentApiRef = toRef(() => props.documentApi);

const { doc } = useDocument(documentApiRef);

const databaseApiRef = computed(() => createDatabaseApi(props.documentApi));

const { properties: databaseProperies } = useDatabaseDocument(databaseApiRef);

const documentType = computed(() => doc.value?.type);

const isShowPropertyCreate = ref(false);

const hasAddProperty = computed(
  () => documentType.value === DATABASE_DOCUMENT_TYPE,
);

const hasRemoveProperty = hasAddProperty;

const isShowPropertyRemove = ref(false);

const isShowItemAdd = ref(false);

const hasItemAdd = hasAddProperty;

const onAddItem = () => {
  databaseApiRef.value.addItem(stateNewItem.value);
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
        :document-api="documentApi"
        @canceled="isShowPropertyCreate = false"
        @created="isShowPropertyCreate = false"
      />
    </ModalCard>

    <ModalCard v-if="isShowPropertyRemove">
      <DbPropertyRemoveForm
        :document-api="documentApi"
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
