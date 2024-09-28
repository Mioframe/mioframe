<script setup lang="ts">
import { computed, ref, toRef } from 'vue';
import type { AnyProperty, Item } from '../../shared/lib/databaseDocument';
import {
  zodDatabaseDocument,
  type PropertyId,
} from '../../shared/lib/databaseDocument';
import type { DocumentApi } from '../../shared/lib/documentApi';
import { createDatabaseApi } from '../../shared/lib/databaseDocument/createDatabaseApi';
import { useDocument } from '../../entities/document';
import { is } from '../../shared/lib/validateZodScheme';
import PropertyField from './properties/PropertyField.vue';
import { isNil, pickBy } from 'lodash-es';
import type { ItemId } from '../../shared/lib/databaseDocument/item';

const props = defineProps<{
  documentApi: DocumentApi;
}>();

const emit = defineEmits<{
  added: [itemId: ItemId];
  canceled: [];
}>();

const stateItem = ref<Item>({});

const documentApi = toRef(() => props.documentApi);

const { doc } = useDocument(documentApi);

const propertiesMap = computed(
  (): Record<PropertyId, AnyProperty> | undefined => {
    if (is(doc.value, zodDatabaseDocument)) {
      return pickBy(doc.value.body.properties, (v) => !isNil(v));
    }
    return undefined;
  },
);

const onSubmit = () => {
  const itemId = createDatabaseApi(props.documentApi).addItem(stateItem.value);

  emit('added', itemId);
};

const onClickCancel = () => {
  stateItem.value = {};
  emit('canceled');
};
</script>

<template>
  <form
    class="block-spacing is-flex is-flex-direction-column"
    @submit.prevent="onSubmit"
  >
    <PropertyField
      v-for="(property, propertyId) in propertiesMap"
      :key="propertyId"
      v-model:value="stateItem[propertyId]"
      :property="property"
    />

    <div class="field is-grouped">
      <div class="control">
        <button class="button" type="submit">Add</button>
      </div>

      <div class="control">
        <button class="button" type="button" @click="onClickCancel">
          Cancel
        </button>
      </div>
    </div>
  </form>
</template>
