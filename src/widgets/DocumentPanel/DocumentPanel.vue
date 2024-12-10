<script setup lang="ts">
import { toRef } from 'vue';
import { ModalCard } from '@shared/ui/ModalCard';
import type { CFRDocument } from '@/shared/lib/cfrDocument';
import { reactiveCFRDocument } from '@entity/document';
import { PROPERTY_TYPE_STRING } from '@entity/stringProperty';
import { PROPERTY_TYPE_BOOLEAN } from '@entity/booleanProperty';
import { PROPERTY_TYPE_NUMBER } from '@entity/numberProperty';
import { PROPERTY_TYPE_DATE } from '@entity/dateProperty';
import { ViewList } from '@entity/documentView';
import { DbPropertyCreateForm } from '@feature/databasePropertyCreate';
import { DbPropertyRemoveForm } from '@feature/databasePropertyRemove';
import { DbItemAdd } from '@feature/databaseItemAdd';
import { StingPropertyField } from '@feature/stringPropertyEdit';
import { NumberPropertyField } from '@feature/numberPropertyEdit';
import { BooleanPropertyField } from '@feature/booleanPropertyEdit';
import { DatePropertyField } from '@feature/datePropertyEdit';
import { DatabaseViewAddForm } from '@feature/databaseViewAdd';
import { UIButton } from '@shared/ui/Button';
import { setupDatabaseDocument } from '../MainView/setupDatabaseDocument';
import { ButtonGroup } from '@shared/ui/ButtonGroup';
import { ButtonGrid } from '@shared/ui/ButtonGrid';

const props = defineProps<{
  cfrDocument: CFRDocument;
}>();

const cfrDocument = toRef(() => props.cfrDocument);

const refCFRDocument = reactiveCFRDocument(cfrDocument);

const {
  databaseProperties,
  databaseViews,
  isDatabaseType: hasAddProperty,
  hasRemoveProperty,
  isShowPropertyCreate,
  isShowPropertyRemove,
  isShowItemAdd,
  hasItemAdd,
  onAddItem,
  onCancelAddItem,
  stateNewItem,
  isShowViewAdd,
  isShowViewList,
  onSubmitViewAdd,
  selectedView,
  selectedViewId,
} = setupDatabaseDocument(refCFRDocument);

// todo: вынести в общий виджет
</script>

<template>
  <div class="document-panel">
    <ButtonGrid>
      <ButtonGroup>
        <UIButton class="is-flex-grow-1" :label="selectedView?.name">
          <template #icon>
            <i class="fa-solid fa-sliders" />
          </template>
        </UIButton>

        <UIButton
          :active="isShowViewList"
          @click="isShowViewList = !isShowViewList"
        >
          <template #icon>
            <i class="fa-solid fa-caret-down" />
          </template>
        </UIButton>
      </ButtonGroup>

      <ViewList
        v-if="isShowViewList && databaseViews"
        class="card is-fullwidth is-shadowless is-overflow-x-auto"
        :views="databaseViews"
      >
        <template #default="{ id, view }">
          <UIButton
            :label="view.name"
            :active="selectedViewId === id"
            @click="selectedViewId = id"
          >
            <template #icon>
              <i class="fa-solid fa-table" />
            </template>
          </UIButton>
        </template>

        <template #after>
          <li>
            <UIButton label="Add view" @click="isShowViewAdd = true">
              <template #icon>
                <i class="fa-solid fa-plus" />
              </template>
            </UIButton>
          </li>
        </template>
      </ViewList>

      <UIButton
        v-if="hasItemAdd"
        label="Add Item"
        @click="isShowItemAdd = true"
      >
        <template #icon><i class="fas fa-plus" /></template>
      </UIButton>

      <UIButton
        v-if="hasAddProperty"
        label="Add Property"
        @click="isShowPropertyCreate = true"
      >
        <template #icon><i class="fas fa-square-plus" /></template>
      </UIButton>

      <UIButton
        v-if="hasRemoveProperty"
        label="Remove Property"
        @click="isShowPropertyRemove = true"
      >
        <template #icon><i class="fas fa-trash" /></template>
      </UIButton>
    </ButtonGrid>

    <ModalCard v-if="isShowViewAdd">
      <DatabaseViewAddForm
        @submit="onSubmitViewAdd"
        @cancel="isShowViewAdd = false"
      />
    </ModalCard>

    <ModalCard v-if="isShowPropertyCreate">
      <DbPropertyCreateForm
        :cfr-document="cfrDocument"
        @canceled="isShowPropertyCreate = false"
        @created="isShowPropertyCreate = false"
      />
    </ModalCard>

    <ModalCard v-if="isShowPropertyRemove && databaseProperties">
      <DbPropertyRemoveForm
        :properties="databaseProperties"
        @canceled="isShowPropertyRemove = false"
        @removed="isShowPropertyRemove = false"
      />
    </ModalCard>

    <ModalCard v-if="isShowItemAdd && databaseProperties">
      <DbItemAdd
        :properties="databaseProperties"
        @submit="onAddItem"
        @cancel="onCancelAddItem"
      >
        <template #property="{ property, propertyId }">
          <StingPropertyField
            v-if="property.type === PROPERTY_TYPE_STRING"
            v-model:value="stateNewItem[propertyId]"
            :label="property.name"
          />

          <NumberPropertyField
            v-else-if="property.type === PROPERTY_TYPE_NUMBER"
            v-model:value="stateNewItem[propertyId]"
            :label="property.name"
          />

          <BooleanPropertyField
            v-else-if="property.type === PROPERTY_TYPE_BOOLEAN"
            v-model:value="stateNewItem[propertyId]"
            :label="property.name"
          />

          <DatePropertyField
            v-else-if="property.type === PROPERTY_TYPE_DATE"
            v-model:value="stateNewItem[propertyId]"
            :label="property.name"
          />
        </template>
      </DbItemAdd>
    </ModalCard>
  </div>
</template>
