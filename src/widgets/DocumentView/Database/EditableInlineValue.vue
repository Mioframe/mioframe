<script setup lang="ts">
import { ref, toRefs, useTemplateRef, watch, watchEffect } from 'vue';
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
import { useDatabaseValue } from '@entity/databaseValue';

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

const {
  propertyId,
  documentId,
  directoryPath: path,
  itemId,
  class: propClass,
} = toRefs(props);

const emit = defineEmits<{
  'update:property': [property: DatabaseUnknownProperty];
}>();

const { property } = useDatabaseProperty(path, documentId, propertyId);

const { value: initialValue } = useDatabaseValue(
  path,
  documentId,
  itemId,
  propertyId,
);

const showEditForm = ref(false);

const stateValue = ref<unknown>();

watchEffect(() => {
  stateValue.value = initialValue.value;
});

const { post: postValue } = useDatabaseValue(
  path,
  documentId,
  itemId,
  propertyId,
);

const tryEmitValue = async () => {
  if (!isEqual(initialValue.value, stateValue.value)) {
    await postValue(stateValue.value);
  }
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

  showEditForm.value = true;
};

const closeEditor = () => {
  showEditForm.value = false;
};

watch(showEditForm, async (showEditForm) => {
  if (!showEditForm) {
    await tryEmitValue();
  }
});

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
    @interaction-outside="closeEditor"
  >
    <div class="editable-inline-value__edit-popover">
      <ValueField
        v-model:value="stateValue"
        class="editable-inline-value__value-field"
        :directory-path="path"
        :document-id="documentId"
        :property-id="propertyId"
        autofocus
        @keydown.enter="closeEditor"
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
    overflow: auto;
    padding-top: 1step;
  }
}
</style>
