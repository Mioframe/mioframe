<script setup lang="ts">
import { DocumentDatabaseJson } from '@entity/documentDatabase';
import type { AMDocHandle } from '@shared/lib/automerge';
import type {
  DatabaseItem,
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import {
  useDatabaseViewsMap,
  zodDatabaseTableView,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { computed, toRefs, useTemplateRef } from 'vue';
import ValueInline from './ValueInline.vue';
import { DatabaseDataTable } from '@entity/databaseData';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import type { ItemIdQuery } from '@entity/databaseData/queryTypes';
import { unrefElement, useScroll } from '@vueuse/core';

const props = defineProps<{
  docHandle: AMDocHandle;
  viewId?: DatabaseViewId;
  directory: DirectoryFSEntry;
  itemIdQuery?: ItemIdQuery;
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

const viewsMap = useDatabaseViewsMap(docHandle);

const view = computed(
  () =>
    (viewId.value ? viewsMap.get(viewId.value) : viewsMap.defaultView) ??
    viewsMap.defaultView,
);

const scrollTarget = useTemplateRef('scrollTarget');

const scrollTargetEl = computed(() => unrefElement(scrollTarget));

const { arrivedState } = useScroll(scrollTargetEl, {
  throttle: 1e3 / 20,
  observe: true,
});

const arrivedRight = computed(() => arrivedState.right);
</script>

<template>
  <DatabaseDataTable
    v-if="zodIs(view, zodDatabaseTableView)"
    ref="scrollTarget"
    :doc-handle="docHandle"
    :view="view"
    class="database-view-layout"
    :id-query="itemIdQuery"
  >
    <template #value="{ item, itemId, property, propertyId }">
      <slot
        name="value"
        :item="item"
        :item-id="itemId"
        :property="property"
        :property-id="propertyId"
      >
        <ValueInline
          :property="property"
          :value="item[propertyId]"
          :directory="directory"
        />
      </slot>
    </template>

    <template v-if="!!slots.action" #action="{ itemId, item }">
      <div
        class="database-view-layout__action"
        :class="{
          _elevation: !arrivedRight,
        }"
      >
        <slot name="action" :item-id="itemId" :item="item" />
      </div>
    </template>

    <template v-if="!!slots.actionHead" #actionHead>
      <slot name="actionHead" />
    </template>
  </DatabaseDataTable>

  <DocumentDatabaseJson v-else :doc-handle="docHandle" />
</template>

<style lang="css" scoped>
.database-view-layout {
  &__action {
    background-color: var(--md-container-color);
    padding: 1step 0;
    margin: calc(1step * -1);
    margin-left: auto;
    border-radius: var(--md-sys-shape-corner-large);
    width: min-content;
    transition-property: box-shadow;
    transition-duration: var(--md-sys-motion-duration-medium1);

    &._elevation {
      box-shadow: var(--md-sys-elevation-level1);
    }
  }
}
</style>
