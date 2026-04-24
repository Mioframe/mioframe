<script setup lang="ts">
import { computed, ref, toRefs, useTemplateRef, watch } from 'vue';
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
const suppressNextRootClick = ref(false);

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
  if (suppressNextRootClick.value) {
    suppressNextRootClick.value = false;
    return;
  }

  await activateInlineValue();
};

const onInlineClick = async () => {
  suppressNextRootClick.value = true;
  queueMicrotask(() => {
    suppressNextRootClick.value = false;
  });

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

  return Math.min(Math.max(currentValueString.length, 12), 48);
});

const editPopoverStyle = computed(() => {
  const style: Record<string, string> = {};

  if (inlineWidth.value > 0) {
    style.minWidth = `${Math.ceil(inlineWidth.value)}px`;
  }

  if (stringInputSize.value) {
    style.width = `min(calc(${stringInputSize.value}ch + 64px), calc(100dvw - 32px))`;
    style.maxWidth = 'calc(100dvw - 32px)';
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
</script>

<template>
  <MDState
    is="div"
    ref="inlineEl"
    class="editable-inline-value"
    tabindex="0"
    :role="interactiveRole"
    :aria-checked="ariaChecked"
    :aria-haspopup="isBooleanProperty ? undefined : 'dialog'"
    :aria-expanded="isBooleanProperty ? undefined : showEditForm"
    :aria-label="property?.name"
    :class="propClass"
    @click="onRootClick"
    @keydown="onRootKeydown"
  >
    <ValueInline
      :directory-path="path"
      :document-id="documentId"
      :item-id="itemId"
      :property-id="propertyId"
      :tab-index="-1"
      editable
      @click="onInlineClick"
    />
  </MDState>

  <MDOverlayTooltip
    v-if="property"
    v-model:show="showEditForm"
    :target-element="inlineEl"
    @interaction-outside="commitEditor"
  >
    <div class="editable-inline-value__edit-popover" :style="editPopoverStyle">
      <ValueField
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
  display: flex;
  align-items: stretch;
  width: 100%;
  min-height: 100%;
  cursor: pointer;
  --md-state-border-radius: 1step;
  --md-state-display: flex;
  --md-state-align-items: stretch;
  --md-state-width: 100%;
  --md-state-min-width: 100%;
  --md-state-height: 100%;
  --md-state-min-height: 100%;
  --md-state-padding-top: 1step;
  --md-state-padding-right: 1step;
  --md-state-padding-bottom: 1step;
  --md-state-padding-left: 1step;
  transition-property: background-color;
  transition-duration: 0.1s;

  &:hover {
    background-color: rgb(from var(--md-content-color) r g b / 0.04);
  }

  &__edit-popover {
    display: flex;
    flex-direction: column;
    padding-top: 1step;
  }

  &__value-field {
    width: 100%;
  }

  :deep(.md-state__content) {
    flex-grow: 1;
    min-width: 0;
  }
}
</style>
