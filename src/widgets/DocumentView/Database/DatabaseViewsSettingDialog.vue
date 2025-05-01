<script setup lang="ts">
import type { DocHandle } from '@automerge/automerge-repo';
import { useDatabaseDocument } from '@shared/lib/databaseDocument';
import { MDDialog } from '@shared/ui/Dialog';
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

const { docHandle } = defineProps<{
  docHandle: DocHandle<unknown>;
}>();

const emit = defineEmits<{
  completed: [];
  cancel: [];
}>();

const docHandleRef = toRef(() => docHandle);

const { updateView, viewsList, addView } = useDatabaseDocument(docHandleRef);

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
    />

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
  &__list {
    overflow-y: auto;
    flex-shrink: 1;
    --md-list-container-border-radius: 16px;
    gap: 4px;
  }

  &__item {
    --md-list-item-border-radius: 8px;
  }
}
</style>
