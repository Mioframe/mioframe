<script setup lang="ts">
import { ref, toRef } from 'vue';
import {
  DatabaseTableView,
  useDatabaseDocument,
} from '../../entities/database';
import type { MenuItem } from '../../shared/ui/ContextButton';
import { ContextBtn } from '../../shared/ui/ContextButton';
import ValueWidgetInline from '../ValueWidgetInline/ValueWidgetInline.vue';
import type {
  DatabaseDocument,
  ItemId,
  PropertyId,
} from '../../shared/lib/databaseDocument';
import { toRefs } from '@vueuse/core';
import { ModalCard } from '../../shared/ui/ModalCard';
import { DbItemRemoveForm } from '../../features/databaseItemRemove';
import { debounce } from 'lodash-es';

const props = defineProps<{
  databaseDocument: DatabaseDocument;
}>();

const databaseDocumentRef = toRef(() => props.databaseDocument);

const { updateItem } = toRefs(databaseDocumentRef);

const { state } = useDatabaseDocument(databaseDocumentRef);

const onChangeValue = debounce(
  (v: unknown, propertyId: PropertyId, itemId: ItemId) => {
    updateItem.value(itemId, {
      [propertyId]: v,
    });
  },
  500,
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
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- will be supplemented
    case ItemEvents.delete:
      itemIdToRemove.value = itemId;
      break;

    default:
      throw new Error('in context menu unhandled event');
  }
};
</script>

<template>
  <DatabaseTableView v-if="state" :database-state="state">
    <!-- todo: где то тут определяются вьюшки документов? -->
    <template #value="{ property, value, itemId, propertyId }">
      <!-- todo: поменять на слот? -->
      <ValueWidgetInline
        v-if="property"
        :property
        :value
        editable
        class="button is-decorationless"
        @update:value="onChangeValue($event, propertyId, itemId)"
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
  </DatabaseTableView>

  <div v-else>// todo: придумать текст, пока состояние базы отсутствует</div>

  <ModalCard v-if="databaseDocument && itemIdToRemove">
    <DbItemRemoveForm
      :database-document="databaseDocument"
      :item-id="itemIdToRemove"
      @cancel="itemIdToRemove = undefined"
      @removed="itemIdToRemove = undefined"
    />
  </ModalCard>
</template>

<style lang="scss">
.button.is-decorationless {
  --bulma-button-text-decoration: none;
}
</style>
