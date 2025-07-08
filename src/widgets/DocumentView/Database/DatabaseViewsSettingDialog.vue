<script setup lang="ts">
import { useDatabaseViewsMap } from '@shared/lib/databaseDocument';
import { MDDialog, useDialog as useDialog } from '@shared/ui/Dialog';
import { computed, ref, toRefs, watchEffect } from 'vue';
import { MDButton } from '@shared/ui/Button';
import { MDSymbol } from '@shared/ui/Icon';
import { DatabaseViewSortingList } from '@feature/databaseViewSorting';
import type {
  DatabaseView,
  DatabaseViewId,
} from '@shared/lib/databaseDocument/migrations/versions';
import { writableDeepClone } from '@shared/lib/writableDeepClone';
import { DatabaseViewCreateDialog } from '@feature/databaseViewCreate';
import { defineMenuButtonList, MDContextMenuBtn } from '@shared/ui/Menu';
import { DatabaseViewRenameDialog } from '@feature/databaseViewRename';
import type { AMDocHandle } from '@shared/lib/automerge/automergeTypes';

const props = defineProps<{
  docHandle: AMDocHandle;
}>();

const { docHandle } = toRefs(props);

const emit = defineEmits<{
  completed: [];
  cancel: [];
}>();

const stateViewList = ref<[DatabaseViewId, DatabaseView][]>([]);

const databaseViewsMap = useDatabaseViewsMap(docHandle);

watchEffect(() => {
  stateViewList.value = databaseViewsMap.list
    ? writableDeepClone(databaseViewsMap.list)
    : [];
});

const onApply = async () => {
  loading.value += 1;
  try {
    await Promise.all(
      stateViewList.value.map(async ([viewId], index) => {
        await databaseViewsMap.put(viewId, {
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
    await databaseViewsMap.create(view);
    isShowCreateDialog.value = false;
  } finally {
    loadingCreateView.value -= 1;
  }
};

enum CONTEXT_ACTION {
  remove,
  rename,
}

const contextMenu = defineMenuButtonList([
  {
    symbolName: 'edit',
    label: 'rename',
    key: CONTEXT_ACTION.rename,
  },
  {
    symbolName: 'delete',
    label: 'remove',
    key: CONTEXT_ACTION.remove,
  },
]);

const { confirm } = useDialog();

const onClickContextMenu = async (
  viewId: DatabaseViewId,
  { key: action }: { key: CONTEXT_ACTION },
) => {
  switch (action) {
    case CONTEXT_ACTION.remove: {
      if (
        await confirm(
          'Remove view?',
          'Are you sure you want to delete View presets?',
          'Remove',
          'delete',
        )
      ) {
        await databaseViewsMap.remove(viewId);
      }

      break;
    }

    case CONTEXT_ACTION.rename: {
      renameViewId.value = viewId;
      break;
    }

    default:
      break;
  }
};

const loadingRenameView = ref(0);

const renameViewId = ref<DatabaseViewId>();

const oldNameOnRenameView = computed(
  () =>
    (renameViewId.value && databaseViewsMap.get(renameViewId.value)?.name) ||
    'unknown',
);

const onSubmitViewRename = async (viewId: DatabaseViewId, newName: string) => {
  loadingRenameView.value += 1;
  try {
    await databaseViewsMap.put(viewId, {
      name: newName,
    });
    renameViewId.value = undefined;
  } finally {
    loadingRenameView.value -= 1;
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

    <DatabaseViewRenameDialog
      v-if="renameViewId"
      :name="oldNameOnRenameView"
      :loading="loadingRenameView"
      @cancel="renameViewId = undefined"
      @apply="onSubmitViewRename(renameViewId, $event)"
    />
  </MDDialog>
</template>
