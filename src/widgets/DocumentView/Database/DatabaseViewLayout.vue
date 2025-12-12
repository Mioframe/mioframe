<script setup lang="ts">
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
} from '@shared/lib/databaseDocument';
import { type DatabaseViewId } from '@shared/lib/databaseDocument';
import { computed, toRefs, useTemplateRef } from 'vue';
import ValueInline from './ValueInline.vue';
import { DatabaseDataTable } from '@entity/databaseData';
import type { ItemIdQuery } from '@shared/service/databaseDocument/data/queryTypes';
import { unrefElement, useScroll } from '@vueuse/core';
import { useDatabaseProperties } from '@entity/databaseProperty';
import DatabasePropertyBlock from '@entity/databaseProperty/DatabasePropertyBlock.vue';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  viewId?: DatabaseViewId;
  itemIdQuery?: ItemIdQuery;
}>();

const slots = defineSlots<{
  value: (p: {
    itemId: DatabaseItemId;
    propertyId: DatabasePropertyId;
  }) => unknown;
  action: (p: { itemId: DatabaseItemId }) => unknown;
  actionHead: () => unknown;
}>();

const { path, documentId } = toRefs(props);

const scrollTarget = useTemplateRef('scrollTarget');

const scrollTargetEl = computed(() => unrefElement(scrollTarget));

const { arrivedState } = useScroll(scrollTargetEl, {
  throttle: 1e3 / 20,
  observe: true,
});

const arrivedRight = computed(() => arrivedState.right);

const { propertiesIdList } = useDatabaseProperties(path, documentId);
</script>

<template>
  <DatabaseDataTable
    v-if="propertiesIdList"
    ref="scrollTarget"
    :directory-path="path"
    :document-id="documentId"
    :view-id="viewId"
    class="database-view-layout"
    :id-query="itemIdQuery"
    :properties="propertiesIdList"
  >
    <template #property="{ propertyId }">
      <DatabasePropertyBlock
        :path="path"
        :document-id="documentId"
        :property-id="propertyId"
      />
    </template>

    <template #value="{ itemId, propertyId }">
      <slot name="value" :item-id="itemId" :property-id="propertyId">
        <ValueInline
          :directory-path="path"
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

  <div v-else>properties in undefined</div>
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
