<script setup lang="ts">
import type { AMDocHandle } from '@shared/lib/automerge';
import DatabaseNestedFilterString from './DatabaseNestedFilterString.vue';
import { computed, toRefs } from 'vue';
import type {
  DatabaseFilter,
  DatabasePropertyId,
  DatabaseViewId,
  GeneralProperty,
} from '@shared/lib/databaseDocument';
import { useDatabaseView } from '@shared/lib/databaseDocument';
import { deepReplaceJsonObject } from '@shared/lib/changeObject';

const props = defineProps<{
  docHandle: AMDocHandle;
  viewId: DatabaseViewId;
}>();

const { docHandle, viewId } = toRefs(props);

defineSlots<{
  valueField(p: {
    property: GeneralProperty;
    propertyId: DatabasePropertyId;
    value: unknown;
    update: (value: unknown) => void;
  }): unknown;
}>();

const view = useDatabaseView(docHandle, viewId);

const filter = computed({
  get: () => view.view?.filter ?? {},
  set: (v: DatabaseFilter) => {
    void view.update((view) => {
      if (!view.filter) {
        view.filter = {};
      }
      deepReplaceJsonObject(view.filter, v, { trimString: true });
    });
  },
});
</script>

<template>
  <DatabaseNestedFilterString v-model:filter="filter" :doc-handle="docHandle">
    <template #valueField="{ property, propertyId, update, value }">
      <slot
        :value="value"
        :update="update"
        name="valueField"
        :property="property"
        :property-id="propertyId"
      />
    </template>
  </DatabaseNestedFilterString>
</template>
