<script setup lang="ts">
import { DatabaseDataTable } from '@entity/databaseData';
import DatabasePropertyBlock from '@entity/databaseProperty/DatabasePropertyBlock.vue';
import { useDatabaseProperties } from '@entity/databaseProperty';
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import type { ItemIdQuery } from '@shared/service';
import { unrefElement, useElementBounding, useMutationObserver, useScroll } from '@vueuse/core';
import { computed, onUpdated, toRefs, useTemplateRef } from 'vue';
import ValueInline from './ValueInline.vue';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
  scrollRoot: HTMLElement | null | undefined;
  viewId?: DatabaseViewId | undefined;
  itemIdQuery?: ItemIdQuery | undefined;
}>();

const slots = defineSlots<{
  value: (p: { itemId: DatabaseItemId; propertyId: DatabasePropertyId }) => unknown;
  action: (p: { itemId: DatabaseItemId }) => unknown;
  actionHead: () => unknown;
  after: () => unknown;
}>();

const { documentId, path, scrollRoot } = toRefs(props);

const tableSurface = useTemplateRef<HTMLElement>('tableSurface');
const scrollRootEl = computed(() => unrefElement(scrollRoot.value));

const rootBounding = useElementBounding(scrollRootEl);
const tableBounding = useElementBounding(tableSurface);

const updateSurfaceBounds = () => {
  rootBounding.update();
  tableBounding.update();
};

// Only direct composition children of the explicit scroll root can move the table before it.
// Virtual rows/cells are descendants of the table-surface wrapper and therefore cannot trigger
// this observer; TanStack remains the only virtual-item measurement owner.
useMutationObserver(scrollRootEl, updateSurfaceBounds, { childList: true });

onUpdated(updateSurfaceBounds);

const verticalSurfaceOffset = computed(() => {
  const root = scrollRootEl.value;

  if (!root || !tableSurface.value) {
    return 0;
  }

  return tableBounding.top.value - rootBounding.top.value - root.clientTop + root.scrollTop;
});

const horizontalSurfaceOffset = computed(() => {
  const root = scrollRootEl.value;

  if (!root || !tableSurface.value) {
    return 0;
  }

  return tableBounding.left.value - rootBounding.left.value - root.clientLeft + root.scrollLeft;
});

const { arrivedState } = useScroll(scrollRootEl, {
  throttle: 1e3 / 20,
  observe: true,
});

const arrivedRight = computed(() => arrivedState.right);

const { propertiesIdList } = useDatabaseProperties(path, documentId);
</script>

<template>
  <div class="database-view-layout">
    <div ref="tableSurface" class="database-view-layout__table-surface">
      <DatabaseDataTable
        v-if="propertiesIdList"
        :directory-path="path"
        :document-id="documentId"
        :view-id="viewId"
        :id-query="itemIdQuery"
        :properties="propertiesIdList"
        :scroll-root="scrollRootEl"
        :vertical-surface-offset="verticalSurfaceOffset"
        :horizontal-surface-offset="horizontalSurfaceOffset"
      >
        <template #property="{ propertyId }">
          <DatabasePropertyBlock :path="path" :document-id="documentId" :property-id="propertyId" />
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
    </div>

    <div v-if="!!slots.after" class="database-view-layout__after">
      <slot name="after" />
    </div>
  </div>
</template>

<style lang="css" scoped>
.database-view-layout {
  display: flex;
  flex-direction: column;

  &__table-surface {
    min-width: 100%;
  }

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
