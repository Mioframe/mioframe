<script setup lang="ts">
import { useDatabaseViews } from '@entity/databaseView';
import type { AMDocumentId } from '@shared/lib/automerge';
import {
  zodDatabaseViewId,
  type DatabaseView,
  type DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { useReorderSurface, vReorderIgnore, vReorderItem } from '@shared/lib/sortable';
import { MDList, MDListItem } from '@shared/ui/Lists';
import { computed, toRefs, useTemplateRef } from 'vue';

const props = defineProps<{
  directoryPath: string;
  documentId: AMDocumentId;
  // Accessible current-view state owned by the caller's view-selection composition.
  // Forwarded onto the row as `aria-current` so assistive tech can tell which view is
  // active without depending on a presentation-only leading control.
  currentViewId?: DatabaseViewId | undefined;
}>();

const emit = defineEmits<{
  clickView: [viewId: DatabaseViewId];
}>();

const slots = defineSlots<{
  trailingAction: (p: { viewId: DatabaseViewId }) => unknown;
  leading: (p: { viewId: DatabaseViewId }) => unknown;
}>();

const { directoryPath: path, documentId } = toRefs(props);

const { reorder, views: viewList } = useDatabaseViews(path, documentId);

const viewListEl = useTemplateRef<InstanceType<typeof MDList>>('viewListEl');
const viewListContainerEl = computed(() => viewListEl.value?.$el ?? null);

const viewMap = computed(() => new Map(viewList.value ?? []));

const { displayItemIdList, draggedId } = useReorderSurface(viewListContainerEl, {
  itemIdList: computed(() => (viewList.value ?? []).map(([id]) => id)),
  activation: 'fullRowNative',
  interactiveStrategy: 'explicitIgnoreOnly',
  onCommit: ({ orderedIds }) => {
    const nextOrderedIds = orderedIds.filter((id) => zodIs(id, zodDatabaseViewId));

    if (nextOrderedIds.length !== orderedIds.length) {
      return;
    }

    return reorder(nextOrderedIds);
  },
});

const displayViewIdList = computed(() =>
  displayItemIdList.value.filter((id) => zodIs(id, zodDatabaseViewId)),
);
const draggedViewId = computed(() => {
  const itemId = draggedId.value;

  return itemId && zodIs(itemId, zodDatabaseViewId) ? itemId : undefined;
});

const orderedViewList = computed(() =>
  displayViewIdList.value.reduce<Array<readonly [DatabaseViewId, DatabaseView]>>((result, id) => {
    const view = viewMap.value.get(id);

    if (!view) {
      return result;
    }

    result.push([id, view] as const);
    return result;
  }, []),
);

const onClickView = (id: DatabaseViewId) => {
  emit('clickView', id);
};
</script>

<template>
  <MDList ref="viewListEl" list-style="segmented" class="db-view-map-edit">
    <MDListItem
      v-for="[id, view] in orderedViewList"
      :key="id"
      v-reorder-item="id"
      :mode="!!slots.trailingAction ? 'multi-action' : 'single-action'"
      :label-text="view.name"
      :dragged="draggedViewId === id"
      :aria-current="id === currentViewId ? 'true' : undefined"
      class="db-view-map-edit__view-item"
      @action="onClickView(id)"
    >
      <template v-if="!!slots.leading" #leading>
        <slot name="leading" :view-id="id" />
      </template>

      <template v-if="!!slots.trailingAction" #trailingAction>
        <span v-reorder-ignore>
          <slot name="trailingAction" :view-id="id" />
        </span>
      </template>
    </MDListItem>
  </MDList>
</template>
