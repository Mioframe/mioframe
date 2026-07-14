<script setup lang="ts">
import { PointerActivationConstraints, PointerSensor, type DragEndEvent } from '@dnd-kit/dom';
import { DragDropProvider } from '@dnd-kit/vue';
import { isSortableOperation } from '@dnd-kit/vue/sortable';
import { useDatabaseViews } from '@entity/databaseView';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseView, DatabaseViewId } from '@shared/lib/databaseDocument';
import { MDList } from '@shared/ui/Lists';
import { computed, toRefs } from 'vue';
import DatabaseViewSortableListItem from './DatabaseViewSortableListItem.vue';
import { useDatabaseViewReorderState } from './useDatabaseViewReorderState';

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

const viewMap = computed(() => new Map(viewList.value ?? []));
const canonicalIds = computed(() => (viewList.value ?? []).map(([id]) => id));

const {
  displayIds,
  onDragStart,
  onDragEnd: onReorderDragEnd,
} = useDatabaseViewReorderState(canonicalIds, reorder);

const orderedViewList = computed(() =>
  displayIds.value.reduce<Array<readonly [DatabaseViewId, DatabaseView]>>((result, id) => {
    const view = viewMap.value.get(id);

    if (!view) {
      return result;
    }

    result.push([id, view] as const);
    return result;
  }, []),
);

const getActivationConstraints = (event: PointerEvent) => {
  if (event.pointerType === 'touch' || event.pointerType === 'pen') {
    return [new PointerActivationConstraints.Delay({ value: 400, tolerance: 8 })];
  }

  return [new PointerActivationConstraints.Distance({ value: 4 })];
};

const sensors = [
  PointerSensor.configure({
    activationConstraints: getActivationConstraints,
  }),
];

const onDragEnd = (event: DragEndEvent) => {
  const { operation } = event;
  const source = isSortableOperation(operation) ? operation.source : null;

  onReorderDragEnd({
    canceled: event.canceled,
    isSortableSource: !!source,
    fromIndex: source?.initialIndex ?? 0,
    toIndex: source?.index ?? 0,
  });
};

const onClickView = (id: DatabaseViewId) => {
  emit('clickView', id);
};
</script>

<template>
  <DragDropProvider :sensors="sensors" @drag-start="onDragStart" @drag-end="onDragEnd">
    <MDList list-style="segmented" class="db-view-map-edit">
      <DatabaseViewSortableListItem
        v-for="([id, view], index) in orderedViewList"
        :key="id"
        :view-id="id"
        :index="index"
        :label-text="view.name"
        :mode="!!slots.trailingAction ? 'multi-action' : 'single-action'"
        :aria-current="id === currentViewId ? 'true' : undefined"
        @action="onClickView(id)"
      >
        <template v-if="!!slots.leading" #leading>
          <slot name="leading" :view-id="id" />
        </template>

        <template v-if="!!slots.trailingAction" #trailingAction>
          <slot name="trailingAction" :view-id="id" />
        </template>
      </DatabaseViewSortableListItem>
    </MDList>
  </DragDropProvider>
</template>
