<script setup lang="ts">
import { computed, ref, toRefs, useTemplateRef, watch, watchEffect } from 'vue';
import { zodBooleanProperty } from '@entity/databaseBoolean/boolean';
import { zodIs } from '@shared/lib/validateZodScheme';
import ValueInline from './ValueInline.vue';
import { isEqual, isUndefined } from 'es-toolkit';
import ValueField from './ValueField.vue';
import { useFirstFocus } from '@shared/lib/useFirstFocus';
import type { DatabaseItemId } from '@shared/lib/databaseDocument';
import {
  type DatabasePropertyId,
  type DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import type { EntryPath } from '@shared/lib/fileSystem';
import { MDOverlayTooltip } from '@shared/ui/Tooltips';
import { toggleBoolean } from '@shared/ui/Checkbox';
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDState } from '@shared/ui/State';
import type { MaybeElement } from '@vueuse/core';
import { useDatabasePropertiesClient } from '@entity/databaseProperty';
import { useDatabaseDataClient } from '@entity/databaseData/client';
import { DomainError } from '@shared/lib/error';

const props = withDefaults(
  defineProps<{
    itemId: DatabaseItemId;
    propertyId: DatabasePropertyId;
    directoryPath: EntryPath;
    documentId: AMDocumentId;
  }>(),
  {},
);

const { propertyId, documentId, directoryPath, itemId } = toRefs(props);

const emit = defineEmits<{
  'update:value': [value: unknown];
  'update:property': [property: DatabaseUnknownProperty];
}>();

const { getProperty } = useDatabasePropertiesClient();

const property = computed(() => {
  const property = getProperty(
    directoryPath.value,
    documentId.value,
    propertyId.value,
  );
  if (property instanceof DomainError) {
    return undefined;
  }

  return property;
});

const { getValue } = useDatabaseDataClient();

const initialValue = computed(() =>
  getValue(
    directoryPath.value,
    documentId.value,
    itemId.value,
    propertyId.value,
  ),
);

const showEditForm = ref(false);

const stateValue = ref<unknown>();

watchEffect(() => {
  stateValue.value = initialValue.value;
});

const tryEmitValue = () => {
  if (!isEqual(initialValue.value, stateValue.value)) {
    emit('update:value', stateValue.value);
  }
};

const onClick = () => {
  if (zodIs(property.value, zodBooleanProperty)) {
    stateValue.value = toggleBoolean(
      isUndefined(stateValue.value) ? stateValue.value : !!stateValue.value,
      property.value.indeterminate,
    );
    tryEmitValue();
    return;
  }

  showEditForm.value = true;
};

const refPopover = useTemplateRef('refPopover');

const closeEditor = () => {
  showEditForm.value = false;
};

watch(showEditForm, (showEditForm) => {
  if (!showEditForm) {
    tryEmitValue();
  }
});

useFirstFocus(refPopover, { initialValue: true });

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
    @click="onClick"
  >
    <ValueInline
      :directory-path="directoryPath"
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
    <div ref="refPopover" class="editable-inline-value__edit-popover">
      <ValueField
        v-model:value="stateValue"
        class="editable-inline-value__value-field"
        :directory-path="directoryPath"
        :property="property"
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
