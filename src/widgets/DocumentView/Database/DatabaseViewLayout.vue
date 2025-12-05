<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { type DatabaseViewId } from '@shared/lib/databaseDocument';
import { computed, toRefs, useTemplateRef } from 'vue';
import ValueInline from './ValueInline.vue';
import { DatabaseDataTable } from '@entity/databaseData';
import type { EntryPath } from '@shared/lib/fileSystem';
import type { ItemIdQuery } from '@shared/service/databaseDocument/data/queryTypes';
import { unrefElement, useScroll } from '@vueuse/core';

const props = defineProps<{
  directoryPath: EntryPath;
  documentId: AMDocumentId;
  viewId?: DatabaseViewId;
  itemIdQuery?: ItemIdQuery;
}>();

const slots = defineSlots<{
  value: (p: {
    itemId: DatabaseItemId;
    property: DatabaseUnknownProperty;
    propertyId: DatabasePropertyId;
  }) => unknown;
  action: (p: { itemId: DatabaseItemId }) => unknown;
  actionHead: () => unknown;
}>();

const { directoryPath, documentId } = toRefs(props);

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
    ref="scrollTarget"
    :directory-path="directoryPath"
    :document-id="documentId"
    :view-id="viewId"
    class="database-view-layout"
    :id-query="itemIdQuery"
  >
    <template #value="{ itemId, property, propertyId }">
      <slot
        name="value"
        :item-id="itemId"
        :property="property"
        :property-id="propertyId"
      >
        <ValueInline
          :directory-path="directoryPath"
          :document-id="documentId"
          :property-id="propertyId"
          :item-id="itemId"
        />
      </slot>
    </template>

    <template v-if="!!slots.action" #action="{ itemId }">
      <div
        class="database-view-layout__action"
        :class="{
          _elevation: !arrivedRight,
        }"
      >
        <slot name="action" :item-id="itemId" />
      </div>
    </template>

    <template v-if="!!slots.actionHead" #actionHead>
      <slot name="actionHead" />
    </template>
  </DatabaseDataTable>
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
