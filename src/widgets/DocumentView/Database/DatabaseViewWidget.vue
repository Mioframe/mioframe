<script setup lang="ts">
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownProperty,
  DatabaseViewId,
} from '@shared/lib/databaseDocument';
import { computed, shallowRef, toRefs, useTemplateRef } from 'vue';
import { defineMenuButtonList, MDContextMenuButton } from '@shared/ui/Menu';
import type { AMDocumentId } from '@shared/lib/automerge/automergeTypes';
import EditableInlineValue from './EditableInlineValue.vue';
import { useSnackbar } from '@shared/ui/Snackbar';
import DatabaseViewLayout from './DatabaseViewLayout.vue';
import DatabaseToolbar from './DatabaseToolbar.vue';
import { DatabaseItemEditDialog } from '@feature/databaseItemEdit';
import { isEqual, isUndefined } from 'es-toolkit';
import DatabasePropertyValueFieldById from './DatabasePropertyValueFieldById.vue';
import { MD_TYPESCALE } from '@shared/lib/md';
import { useDatabaseProperties } from '@entity/databaseProperty';
import { useDatabaseValueWrite } from '@entity/databaseValue';
import { DomainError } from '@shared/lib/error';
import { useDatabaseViewSelection } from '@entity/databaseView';
import { useDatabaseData } from '@entity/databaseData/useDatabaseData';
import {
  DatabaseExampleDocumentCreateSuccessCard,
  useDatabaseExampleDocumentCreateSuccess,
} from '@feature/exampleDocumentsCreate';

const props = defineProps<{
  documentId: AMDocumentId;
  directoryPath: string;
}>();

const { directoryPath: path, documentId } = toRefs(props);
const { isVisible: isSuccessCardVisible, dismiss: dismissSuccessCard } =
  useDatabaseExampleDocumentCreateSuccess(path, documentId);
const stateExplicitViewId = shallowRef<DatabaseViewId>();
const {
  viewList: databaseViewList,
  explicitViewId,
  effectiveViewId,
  setExplicitViewId,
} = useDatabaseViewSelection(path, documentId, stateExplicitViewId);

const documentError = computed(() => {
  if (databaseViewList.value instanceof DomainError) {
    return databaseViewList.value;
  }

  return undefined;
});

enum ITEM_CONTEXT_ACTION {
  edit,
  remove,
}

const itemContextualButtons = defineMenuButtonList([
  { symbolName: 'edit_note', label: 'edit', key: ITEM_CONTEXT_ACTION.edit },
  { symbolName: 'delete', label: 'remove', key: ITEM_CONTEXT_ACTION.remove },
]);

const { addSnackbar } = useSnackbar();

const { removeItem } = useDatabaseData(path, documentId);
const { postValue } = useDatabaseValueWrite(path, documentId);

interface ActiveInlineEditSession {
  itemId: DatabaseItemId;
  propertyId: DatabasePropertyId;
  initialValue: unknown;
  draft: unknown;
  resolving: boolean;
}

const activeInlineEditSession = shallowRef<ActiveInlineEditSession>();
let activeInlineEditResolution: Promise<boolean> | undefined;

const isActiveInlineEdit = (
  session: ActiveInlineEditSession | undefined,
  itemId: DatabaseItemId,
  propertyId: DatabasePropertyId,
): session is ActiveInlineEditSession =>
  session?.itemId === itemId && session.propertyId === propertyId;

const getInlineEditSession = (itemId: DatabaseItemId, propertyId: DatabasePropertyId) => {
  const session = activeInlineEditSession.value;

  if (!isActiveInlineEdit(session, itemId, propertyId)) {
    return undefined;
  }

  return {
    draft: session.draft,
    resolving: session.resolving,
  };
};

const resolveActiveInlineEdit = (): Promise<boolean> => {
  if (activeInlineEditResolution) {
    return activeInlineEditResolution;
  }

  const session = activeInlineEditSession.value;

  if (!session) {
    return Promise.resolve(true);
  }

  activeInlineEditSession.value = {
    ...session,
    resolving: true,
  };

  const resolution = (async () => {
    try {
      if (!isEqual(session.initialValue, session.draft)) {
        await postValue(session.itemId, session.propertyId, session.draft);
      }

      if (isActiveInlineEdit(activeInlineEditSession.value, session.itemId, session.propertyId)) {
        activeInlineEditSession.value = undefined;
      }

      return true;
    } catch {
      const currentSession = activeInlineEditSession.value;

      if (isActiveInlineEdit(currentSession, session.itemId, session.propertyId)) {
        activeInlineEditSession.value = {
          ...currentSession,
          resolving: false,
        };
      }

      return false;
    }
  })();

  activeInlineEditResolution = resolution;
  void resolution.finally(() => {
    if (activeInlineEditResolution === resolution) {
      activeInlineEditResolution = undefined;
    }
  });

  return resolution;
};

const onRequestInlineEdit = async (
  itemId: DatabaseItemId,
  propertyId: DatabasePropertyId,
  initialValue: unknown,
) => {
  if (isActiveInlineEdit(activeInlineEditSession.value, itemId, propertyId)) {
    return;
  }

  if (!(await resolveActiveInlineEdit())) {
    return;
  }

  activeInlineEditSession.value = {
    itemId,
    propertyId,
    initialValue,
    draft: initialValue,
    resolving: false,
  };
};

const onUpdateInlineEditDraft = (
  itemId: DatabaseItemId,
  propertyId: DatabasePropertyId,
  draft: unknown,
) => {
  const session = activeInlineEditSession.value;

  if (!isActiveInlineEdit(session, itemId, propertyId) || session.resolving) {
    return;
  }

  activeInlineEditSession.value = {
    ...session,
    draft,
  };
};

const onCommitInlineEdit = (itemId: DatabaseItemId, propertyId: DatabasePropertyId) => {
  if (isActiveInlineEdit(activeInlineEditSession.value, itemId, propertyId)) {
    void resolveActiveInlineEdit();
  }
};

const onCancelInlineEdit = (itemId: DatabaseItemId, propertyId: DatabasePropertyId) => {
  const session = activeInlineEditSession.value;

  if (isActiveInlineEdit(session, itemId, propertyId) && !session.resolving) {
    activeInlineEditSession.value = undefined;
  }
};

const onRequestExplicitViewId = async (viewId: DatabaseViewId | undefined) => {
  if (viewId === explicitViewId.value) {
    return;
  }

  if (await resolveActiveInlineEdit()) {
    setExplicitViewId(viewId);
  }
};

const editedItemId = shallowRef<DatabaseItemId>();
const isShowEditItemDialog = computed({
  get: () => !isUndefined(editedItemId.value),
  set: (v) => {
    if (!v) {
      editedItemId.value = undefined;
    }
  },
});

const onClickItemContextBtn = async (
  { key: action }: { key: ITEM_CONTEXT_ACTION },
  itemId: DatabaseItemId,
) => {
  switch (action) {
    case ITEM_CONTEXT_ACTION.remove:
      await removeItem(itemId);
      break;

    case ITEM_CONTEXT_ACTION.edit: {
      editedItemId.value = itemId;
      break;
    }

    default:
      addSnackbar({
        text: 'work in progress',
      });
      break;
  }
};

const { propertiesIdList, patch: putProperty } = useDatabaseProperties(path, documentId);

const onUpdateProperty = async (propertyId: DatabasePropertyId, v: DatabaseUnknownProperty) => {
  await putProperty(path.value, documentId.value, propertyId, v);
};

const hasProperties = computed(() =>
  propertiesIdList.value ? propertiesIdList.value.length > 0 : undefined,
);

const databaseViewRef = useTemplateRef<HTMLElement>('databaseViewRef');

const onCancelEditItemDialog = () => {
  isShowEditItemDialog.value = false;
};

const onUpdatedEditItemDialog = () => {
  isShowEditItemDialog.value = false;
};
</script>

<template>
  <div ref="databaseViewRef" class="database-view">
    <DatabaseExampleDocumentCreateSuccessCard
      v-if="isSuccessCardVisible"
      class="database-view__success-card"
      @dismiss="dismissSuccessCard"
    />

    <div v-if="documentError" class="database-view__error">
      <pre>{{ documentError }}</pre>
    </div>

    <div v-if="!hasProperties" class="database-view__without-properties">
      <h2 :class="MD_TYPESCALE.headline.large">Missing properties.</h2>

      <section :class="MD_TYPESCALE.body.medium">
        To start working with the database, create at least one property using the toolbar.
      </section>

      <DatabaseToolbar
        :explicit-view-id="explicitViewId"
        :document-id="documentId"
        :directory-path="path"
        :auto-hide-target="databaseViewRef"
        @update:explicit-view-id="onRequestExplicitViewId"
      />
    </div>

    <DatabaseViewLayout
      v-else
      :document-id="documentId"
      :view-id="effectiveViewId"
      :path="path"
      :scroll-root="databaseViewRef"
      class="database-view__layout"
    >
      <template #value="{ itemId, propertyId }">
        <EditableInlineValue
          :item-id="itemId"
          :property-id="propertyId"
          :document-id="documentId"
          :directory-path="path"
          :edit-session="getInlineEditSession(itemId, propertyId)"
          @request-edit="onRequestInlineEdit(itemId, propertyId, $event)"
          @update:draft="onUpdateInlineEditDraft(itemId, propertyId, $event)"
          @commit-edit="onCommitInlineEdit(itemId, propertyId)"
          @cancel-edit="onCancelInlineEdit(itemId, propertyId)"
          @update:property="onUpdateProperty(propertyId, $event)"
        />
      </template>

      <template #action="{ itemId }">
        <MDContextMenuButton
          :btns="itemContextualButtons"
          @click="onClickItemContextBtn($event, itemId)"
        />
      </template>

      <template #after>
        <DatabaseToolbar
          :explicit-view-id="explicitViewId"
          :document-id="documentId"
          :directory-path="path"
          :auto-hide-target="databaseViewRef"
          @update:explicit-view-id="onRequestExplicitViewId"
        />
      </template>
    </DatabaseViewLayout>

    <DatabaseItemEditDialog
      v-if="isShowEditItemDialog"
      :directory-path="path"
      :document-id="documentId"
      :item-id="editedItemId"
      apply-label="Edit"
      @cancel="onCancelEditItemDialog"
      @updated="onUpdatedEditItemDialog"
    >
      <template #valueField="{ update, value, propertyId, index }">
        <DatabasePropertyValueFieldById
          :document-id="documentId"
          :property-id="propertyId"
          :value="value"
          :directory-path="path"
          :autofocus="!index"
          @update:value="update"
          @update:property="onUpdateProperty(propertyId, $event)"
        />
      </template>
    </DatabaseItemEditDialog>
  </div>
</template>

<style lang="css" scoped>
.database-view {
  display: flex;
  flex-direction: column;
  flex: 1 0;
  overflow: auto;
  padding: 0 4step 0;
  gap: 2step;

  &__success-card {
    flex-shrink: 0;
  }

  &__controls {
    margin-top: auto;
    flex-shrink: 0;
    position: sticky;
    bottom: 0;
    background: transparent;
  }

  &__table {
    flex-grow: 1;
  }

  &__without-properties {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4step;
    flex-grow: 1;
    text-align: center;
    padding: 4step;
  }
}

.sheet {
  &__head {
    display: flex;
  }

  &__body {
    padding: 16px;
  }
}
</style>
