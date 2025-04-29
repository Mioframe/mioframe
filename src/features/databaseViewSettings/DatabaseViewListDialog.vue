<script setup lang="ts">
import type { DocHandle } from '@automerge/automerge-repo';
import { writableDeepClone } from '@shared/lib/writableDeepClone';
import { useDatabaseDocument } from '@shared/lib/databaseDocument';
import { MDDialog } from '@shared/ui/Dialog';
import { MDListContainer, MDListItem } from '@shared/ui/Lists';
import { ref, shallowRef, toRef, watchEffect } from 'vue';
import { useSortable } from '@vueuse/integrations/useSortable';
import { templateRef } from '@vueuse/core';
import type { DatabaseView, DatabaseViewId } from '@shared/lib/databaseDocument/state/v2';

const { docHandle } = defineProps<{
  docHandle: DocHandle<unknown>;
}>();

const emit = defineEmits<{
  completed: [];
  cancel: [];
}>();

const docHandleRef = toRef(() => docHandle);

const { views, updateView } = useDatabaseDocument(docHandleRef);

const stateViewList = shallowRef<[DatabaseViewId, DatabaseView][]>([]);

watchEffect(() => {
  views.value.forEach((view, viewId) => {
    stateViewList.value.push([viewId, writableDeepClone(view)]);
  });
  stateViewList.value.sort(([, { order: a }], [, { order: b }]) => a - b);
});

const onApply = async () => {
  loading.value += 1;
  try {
    await Promise.all(
      stateViewList.value.map(async ([viewId], index) => {
        await updateView(viewId, {
          order: index,
        });
      }),
    );
    emit('completed');
  } finally {
    loading.value -= 1;
  }
};

const onCancel = () => {
  emit('cancel');
};

const loading = ref(0);

const listContainer = templateRef('listContainer');

useSortable(listContainer, stateViewList);

// TODO: внедрить в виджет, проверить работоспособность изменения состояния views
</script>

<template>
  <MDDialog
    headline="Setting up views"
    supporting-text="Customize the list of view presets"
    apply-label="Ok"
    has-cancel-action
    :loading="!!loading"
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDListContainer ref="listContainer">
      <MDListItem
        v-for="[id, view] in stateViewList"
        :key="id"
        :headline="view.name"
        :supporting-text="`${view.order}`"
      />
    </MDListContainer>
  </MDDialog>
</template>
