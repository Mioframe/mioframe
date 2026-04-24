<script setup lang="ts">
import { ref, toRefs, useTemplateRef, watch } from 'vue';
import { zodBooleanProperty } from '@entity/databaseBoolean/boolean';
import { zodIs } from '@shared/lib/validateZodScheme';
import ValueInline from './ValueInline.vue';
import { isEqual, isUndefined } from 'es-toolkit';
import ValueField from './ValueField.vue';
import type { DatabaseItemId } from '@shared/lib/databaseDocument';
import {
  type DatabasePropertyId,
  type DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { MDOverlayTooltip } from '@shared/ui/Tooltips';
import { toggleBoolean } from '@shared/ui/Checkbox';
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDState } from '@shared/ui/State';
import type { MaybeElement } from '@vueuse/core';
import { useDatabaseProperty } from '@entity/databaseProperty';
import { useDatabaseEffectiveValue, useDatabaseStoredValue } from '@entity/databaseValue';

const props = withDefaults(
  defineProps<{
    itemId: DatabaseItemId;
    propertyId: DatabasePropertyId;
    directoryPath: string;
    documentId: AMDocumentId;
    class?: unknown;
  }>(),
  {},
);

const emit = defineEmits<{
  'update:property': [property: DatabaseUnknownProperty];
}>();

const { propertyId, documentId, directoryPath: path, itemId, class: propClass } = toRefs(props);

const { property } = useDatabaseProperty(path, documentId, propertyId);

const { value } = useDatabaseEffectiveValue(path, documentId, itemId, propertyId);
const { post: postValue } = useDatabaseStoredValue(path, documentId, itemId, propertyId);

const showEditForm = ref(false);

const stateValue = ref<unknown>();
const syncStateValue = () => {
  stateValue.value = value.value;
};

const tryEmitValue = async () => {
  if (!isEqual(value.value, stateValue.value)) {
    await postValue(stateValue.value);
  }
};

const startEditing = () => {
  stateValue.value = value.value;
  showEditForm.value = true;
};

const commitEditor = async () => {
  showEditForm.value = false;
  await tryEmitValue();
  syncStateValue();
};

const cancelEditor = () => {
  showEditForm.value = false;
  syncStateValue();
};

const onClick = async () => {
  if (zodIs(property.value, zodBooleanProperty)) {
    const newState = toggleBoolean(
      isUndefined(stateValue.value) ? stateValue.value : !!stateValue.value,
      property.value.indeterminate,
    );

    stateValue.value = newState;
    await tryEmitValue();
    return;
  }

  startEditing();
};

watch(
  value,
  () => {
    if (!showEditForm.value) {
      syncStateValue();
    }
  },
  {
    immediate: true,
  },
);

watch(
  showEditForm,
  (isVisible) => {
    if (!isVisible) {
      syncStateValue();
    }
  },
  {
    immediate: true,
  },
);

const inlineEl = useTemplateRef<MaybeElement>('inlineEl');

const onUpdateProperty = (v: DatabaseUnknownProperty) => {
  emit('update:property', v);
};
</script>

<template>
  <MDState
    is="a"
    ref="inlineEl"
    class="editable-inline-value"
    tabindex="0"
    :class="propClass"
    @click="onClick"
  >
    <ValueInline
      :directory-path="path"
      :document-id="documentId"
      :item-id="itemId"
      :property-id="propertyId"
      editable
      @click="onClick"
    />
  </MDState>

  <MDOverlayTooltip
    v-if="property"
    v-model:show="showEditForm"
    :target-element="inlineEl"
    @interaction-outside="commitEditor"
  >
    <div class="editable-inline-value__edit-popover">
      <ValueField
        v-model:value="stateValue"
        class="editable-inline-value__value-field"
        :directory-path="path"
        :document-id="documentId"
        :property-id="propertyId"
        autofocus
        @keydown.enter="commitEditor"
        @keydown.escape="cancelEditor"
        @update:property="onUpdateProperty"
      />
    </div>
  </MDOverlayTooltip>
</template>

<style scoped>
.editable-inline-value {
  cursor: pointer;
  text-decoration-style: dashed;
  text-decoration-line: underline;
  text-decoration-color: transparent;
  transition-property: text-decoration-color;
  transition-duration: 0.1s;
  --md-state-border-radius: 1step;

  &:hover {
    text-decoration-color: rgb(from var(--md-content-color) r g b / 0.5);
  }

  &__edit-popover {
    display: flex;
    flex-direction: column;
    padding-top: 1step;
  }
}
</style>
