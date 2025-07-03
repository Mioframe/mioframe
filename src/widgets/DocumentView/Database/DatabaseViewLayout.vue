<script setup lang="ts">
import {
  DocumentDatabaseJson,
  DocumentDatabaseTable,
} from '@entity/documentDatabase';
import type { AMDocHandle } from '@shared/lib/automerge';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import {
  useDatabaseDocument,
  zodDatabaseTableView,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { useWrapStrictRecord } from '@shared/lib/strictRecord';
import { zodIs } from '@shared/lib/validateZodScheme';
import { computed, toRefs } from 'vue';
import ValueInline from './ValueInline.vue';

const props = defineProps<{
  docHandle: AMDocHandle;
  viewId?: DatabaseViewId;
}>();

const slots = defineSlots<{
  value: (p: {
    item: DatabaseItem;
    itemId: DatabaseItemId;
    property: DatabaseUnknownProperty;
    propertyId: DatabasePropertyId;
  }) => unknown;
  action: (p: { item: DatabaseItem; itemId: DatabaseItemId }) => unknown;
  actionHead: () => unknown;
}>();

const { docHandle, viewId } = toRefs(props);

const databaseDocument = useDatabaseDocument(docHandle);

const views = computed(() => databaseDocument.state?.views);

const viewsRecord = useWrapStrictRecord(views);

const view = computed(() =>
  viewId.value ? viewsRecord.value?.get(viewId.value) : undefined,
);

const properties = computed(() => databaseDocument.state?.properties);
</script>

<template>
  <DocumentDatabaseTable
    v-if="zodIs(view, zodDatabaseTableView) && properties"
    :doc-handle
    :view="view"
    class="database-view__table"
    :properties
  >
    <template #value="{ item, itemId, property, propertyId }">
      <slot name="value" :item :item-id :property :property-id>
        <ValueInline :property :value="item[propertyId]" />
      </slot>
    </template>

    <template v-if="!!slots.action" #action="{ itemId, item }">
      <slot name="action" :item-id :item />
    </template>

    <template v-if="!!slots.actionHead" #actionHead>
      <slot name="actionHead" />
    </template>
  </DocumentDatabaseTable>

  <DocumentDatabaseJson v-else :doc-handle />
</template>
