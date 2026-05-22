<script setup lang="ts">
import { computed, ref, toRefs, useTemplateRef, watch } from 'vue';
import ValueInline from './ValueInline.vue';
import { isEqual, isUndefined } from 'es-toolkit';
import DatabasePropertyValueFieldById from './DatabasePropertyValueFieldById.vue';
import type { DatabaseItemId } from '@shared/lib/databaseDocument';
import {
  type DatabasePropertyId,
  type DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { MDOverlayTooltip } from '@shared/ui/Tooltips';
import { toggleBoolean } from '@shared/ui/Checkbox';
import type { AMDocumentId } from '@shared/lib/automerge';
import { MDStateLayer, useRipple, useStateLayer } from '@shared/ui/State';
import { useElementSize } from '@vueuse/core';
import { zodBooleanProperty } from '@entity/databaseBoolean';
import { useDatabaseProperty } from '@entity/databaseProperty';
import { zodIs } from '@shared/lib/validateZodScheme';
import { useDatabaseEffectiveValue, useDatabaseStoredValue } from '@entity/databaseValue';
import { zodStringProperty } from '@entity/databaseString';

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

const isBooleanProperty = computed(() => zodIs(property.value, zodBooleanProperty));
const isStringProperty = computed(() => zodIs(property.value, zodStringProperty));

const triggerBooleanToggle = async () => {
  const booleanProperty = property.value;

  if (!zodIs(booleanProperty, zodBooleanProperty)) {
    return;
  }

  const newState = toggleBoolean(
    isUndefined(stateValue.value) ? stateValue.value : !!stateValue.value,
    booleanProperty.indeterminate,
  );

  stateValue.value = newState;
  await tryEmitValue();
};

const activateInlineValue = async () => {
  if (isBooleanProperty.value) {
    await triggerBooleanToggle();
    return;
  }

  startEditing();
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

const onRootClick = async () => {
  await activateInlineValue();
};

const onRootKeydown = async (event: KeyboardEvent) => {
  if (!['Enter', ' '].includes(event.key)) {
    return;
  }

  event.preventDefault();
  await activateInlineValue();
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

const inlineEl = useTemplateRef<HTMLElement>('inlineEl');
const { width: inlineWidth } = useElementSize(inlineEl);

const onUpdateProperty = (v: DatabaseUnknownProperty) => {
  emit('update:property', v);
};

const stringInputSize = computed(() => {
  if (!isStringProperty.value) {
    return undefined;
  }

  const currentValue = stateValue.value ?? value.value;
  const currentValueString = typeof currentValue === 'string' ? currentValue : String(currentValue);

  return Math.max(currentValueString.length, 12);
});

const editPopoverStyle = computed(() => {
  const style: Record<string, string> = {};

  if (inlineWidth.value > 0) {
    style.minWidth = `${Math.ceil(inlineWidth.value)}px`;
  }

  if (stringInputSize.value) {
    style.width = `min(calc(${stringInputSize.value}ch + 64px), calc(100dvw - 32px))`;
  }

  return style;
});

const interactiveRole = computed(() => (isBooleanProperty.value ? 'checkbox' : 'button'));

const ariaChecked = computed(() => {
  const booleanProperty = property.value;

  if (!zodIs(booleanProperty, zodBooleanProperty)) {
    return undefined;
  }

  if (isUndefined(value.value)) {
    return booleanProperty.indeterminate ? 'mixed' : !!booleanProperty.default;
  }

  return !!value.value;
});

const { hover, focused, durationPressedState } = useStateLayer(inlineEl);

useRipple(inlineEl);
</script>

<template>
  <div
    ref="inlineEl"
    class="editable-inline-value"
    tabindex="0"
    :role="interactiveRole"
    :aria-checked="ariaChecked"
    :aria-haspopup="isBooleanProperty ? undefined : 'dialog'"
    :aria-expanded="isBooleanProperty ? undefined : showEditForm"
    :aria-label="property?.name"
    :class="[
      propClass,
      {
        'md-state_hover': hover,
        'md-state_focused': focused,
        'md-state_pressed': durationPressedState,
      },
    ]"
    @click="onRootClick"
    @keydown="onRootKeydown"
  >
    <MDStateLayer :hover="hover" :focused="focused" :pressed="durationPressedState" />

    <ValueInline
      :directory-path="path"
      :document-id="documentId"
      :item-id="itemId"
      :property-id="propertyId"
    />
  </div>

  <MDOverlayTooltip
    v-if="property"
    v-model:show="showEditForm"
    :target-element="inlineEl"
    @interaction-outside="commitEditor"
  >
    <div class="editable-inline-value__edit-popover" :style="editPopoverStyle">
      <DatabasePropertyValueFieldById
        v-model:value="stateValue"
        class="editable-inline-value__value-field"
        :directory-path="path"
        :document-id="documentId"
        :property-id="propertyId"
        :input-size="stringInputSize ?? 0"
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
  position: relative;
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: 100%;
  cursor: pointer;
  padding: 1step;
  border-radius: 1step;
  transition-property: background-color;
  transition-duration: 0.1s;

  &__edit-popover {
    display: flex;
    flex-direction: column;
    padding-top: 1step;
    max-width: 100%;
  }

  &__value-field {
    width: 100%;
  }

  > :not(.md-state-layer) {
    flex-grow: 1;
    min-width: 0;
  }
}
</style>
