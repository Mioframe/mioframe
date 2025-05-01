<script setup lang="ts">
import type { DocHandle } from '@automerge/automerge-repo';
import { useDatabaseDocument } from '@shared/lib/databaseDocument';
import { MDDialog, useDialog as useDialog } from '@shared/ui/Dialog';
import { ref, toRef, watchEffect } from 'vue';
import { MDButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { DatabaseViewSortingList } from '@feature/databaseViewSorting';
import type {
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument/state';
import { writableDeepClone } from '@shared/lib/writableDeepClone';
import { DatabaseViewCreateDialog } from '@feature/databaseViewCreate';
import { defineContextButtonList, MDContextMenuBtn } from '@shared/ui/Menu';

const { docHandle } = defineProps<{
  docHandle: DocHandle<unknown>;
}>();

const emit = defineEmits<{
  completed: [];
  cancel: [];
}>();

const docHandleRef = toRef(() => docHandle);

const { updateView, viewsList, addView, removeView } =
  useDatabaseDocument(docHandleRef);

const stateViewList = ref<[DatabaseViewId, DatabaseView][]>([]);

// watch(
//   viewsList,
//   (viewsList) => {
//     stateViewList.value = viewsList ? writableDeepClone(viewsList) : [];
//   },
//   { immediate: true },
// );

watchEffect(() => {
  stateViewList.value = viewsList.value
    ? writableDeepClone(viewsList.value)
    : [];
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

const isShowCreateDialog = ref(false);

const loadingCreateView = ref(0);

const onSubmitViewCreate = async (view: DatabaseView) => {
  loadingCreateView.value += 1;
  try {
    await addView(view);
    isShowCreateDialog.value = false;
  } finally {
    loadingCreateView.value -= 1;
  }
};

enum CONTEXT_ACTION {
  remove,
  rename,
}

const contextMenu = defineContextButtonList([
  [
    CONTEXT_ACTION.remove,
    {
      symbolName: 'delete',
      text: 'remove',
    },
  ],
]);

const { confirm } = useDialog();

const onClickContextMenu = async (
  viewId: DatabaseViewId,
  action: CONTEXT_ACTION,
) => {
  if (action === CONTEXT_ACTION.remove) {
    if (
      await confirm(
        'Remove view?',
        'Are you sure you want to delete View presets?',
        'Remove',
        'delete',
      )
    ) {
      await removeView(viewId);
    }
  }
};
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
    <DatabaseViewSortingList
      v-if="stateViewList"
      v-model:views-list="stateViewList"
    >
      <template #trailingIcon="{ viewId }">
        <MDContextMenuBtn
          :btns="contextMenu"
          disabled-teleport
          @click="onClickContextMenu(viewId, $event)"
        />
      </template>
    </DatabaseViewSortingList>

    <section>
      <MDButton label="Add new view" @click="isShowCreateDialog = true">
        <template #icon>
          <MDSymbol name="add" />
        </template>
      </MDButton>
    </section>

    <DatabaseViewCreateDialog
      v-if="isShowCreateDialog"
      :loading="loadingCreateView"
      @cancel="isShowCreateDialog = false"
      @submit="onSubmitViewCreate"
    />
  </MDDialog>
</template>

<style lang="css" scoped>
.database-view-list-dialog {
}
</style>
