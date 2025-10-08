<script setup lang="ts">
import { useDatabaseViewsClient } from '@entity/databaseView/viewsClient';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseViewId } from '@shared/lib/databaseDocument';
import { DomainError } from '@shared/lib/error';
import type { EntryPath } from '@shared/lib/fileSystem';
import { useSortableListener } from '@shared/lib/sortable/useSortable';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { computed } from 'vue';
import { toRefs, useTemplateRef } from 'vue';

const props = defineProps<{
  directoryPath: EntryPath;
  documentId: AMDocumentId;
}>();

const { directoryPath, documentId } = toRefs(props);

const emit = defineEmits<{
  clickView: [viewId: DatabaseViewId];
}>();

const slots = defineSlots<{
  trailingIcon: (p: { viewId: DatabaseViewId }) => unknown;
  leadingIcon: (p: { viewId: DatabaseViewId }) => unknown;
}>();

const {
  changeOrder,
  getViewList: { get: getViewList },
} = useDatabaseViewsClient();

const viewList = computed(() =>
  getViewList(directoryPath.value, documentId.value),
);

const viewListEl = useTemplateRef('viewListEl');

const { draggableIndex } = useSortableListener(viewListEl, (from, to) => {
  void changeOrder(directoryPath.value, documentId.value, from, to);
});

const onClickView = (id: DatabaseViewId) => {
  emit('clickView', id);
};
</script>

<template>
  <MDListContainer ref="viewListEl" transition class="db-view-map-edit">
    <!-- eslint-disable-next-line prettier/prettier -->
    <div v-if="(viewList instanceof DomainError)">
      Error: {{ viewList.message }}
    </div>

    <template v-else>
      <MDListItem
        is="button"
        v-for="([id, view], index) in viewList"
        :key="id"
        :headline="view.name"
        draggable
        class="db-view-map-edit__view-item"
        :class="{ 'md-state_drag': draggableIndex === index }"
        @click="onClickView(id)"
      >
        <template v-if="!!slots.leadingIcon" #leadingIcon>
          <slot name="leadingIcon" :view-id="id" />
        </template>

        <template v-if="!!slots.trailingIcon" #trailingIcon>
          <slot name="trailingIcon" :view-id="id" />
        </template>
      </MDListItem>
    </template>
  </MDListContainer>
</template>
