<script setup lang="ts">
import { zodBooleanProperty } from '@entity/databaseBoolean';
import { useDatabaseProperty } from '@entity/databaseProperty';
import { useDatabaseEffectiveValue, useDatabaseStoredValue } from '@entity/databaseValue';
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabaseItemId,
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { MDStateLayer, useRipple, useStateLayer } from '@shared/ui/State';
import { MDOverlayTooltip } from '@shared/ui/Tooltips';
import { toggleBoolean } from '@shared/ui/Checkbox';
import { zodIs } from '@shared/lib/validateZodScheme';
import { zodStringProperty } from '@entity/databaseString';
import { isUndefined } from 'es-toolkit';
import { useElementSize } from '@vueuse/core';
import { computed, onBeforeUnmount, ref, toRefs, useTemplateRef } from 'vue';
import DatabasePropertyValueFieldById from './DatabasePropertyValueFieldById.vue';
import ValueInline from './ValueInline.vue';

const props = withDefaults(
  defineProps<{
    itemId: DatabaseItemId;
    propertyId: DatabasePropertyId;
    directoryPath: string;
    documentId: AMDocumentId;
    editSession?: Readonly<{ draft: unknown; resolving: boolean }> | undefined;
    class?: unknown;
  }>(),
  {},
);

const emit = defineEmits<{
  requestEdit: [initialValue: unknown];
  'update:draft': [draft: unknown];
  commitEdit: [];
  cancelEdit: [];
  'update:property': [property: DatabaseUnknownProperty];
}>();

const { propertyId, documentId, directoryPath: path, itemId, class: propClass } = toRefs(props);

const { property } = useDatabaseProperty(path, documentId, propertyId);

const { value } = useDatabaseEffectiveValue(path, documentId, itemId, propertyId);
const { post: postValue } = useDatabaseStoredValue(path, documentId, itemId, propertyId);

const isEditorOpen = computed(
  () => props.editSession !== undefined && !props.editSession.resolving,
);
const isInteractionEnabled = computed(() => !props.editSession?.resolving);
const isCancellationRequested = ref(false);

const editorValue = computed<unknown>({
  get: () => props.editSession?.draft ?? value.value,
  set: (draft) => {
    if (isEditorOpen.value) {
      emit('update:draft', draft);
    }
  },
});

const isBooleanProperty = computed(() => zodIs(property.value, zodBooleanProperty));
const isStringProperty = computed(() => zodIs(property.value, zodStringProperty));

const triggerBooleanToggle = async () => {
  if (!isInteractionEnabled.value) {
    return;
  }

  const booleanProperty = property.value;

  if (!zodIs(booleanProperty, zodBooleanProperty)) {
    return;
  }

  const newState = toggleBoolean(
    isUndefined(value.value) ? value.value : !!value.value,
    booleanProperty.indeterminate,
  );

  await postValue(newState);
};

const requestEditor = () => {
  if (isInteractionEnabled.value && !isEditorOpen.value) {
    isCancellationRequested.value = false;
    emit('requestEdit', value.value);
  }
};

const activateInlineValue = async () => {
  if (isBooleanProperty.value) {
    await triggerBooleanToggle();
    return;
  }

  requestEditor();
};

const commitEditor = () => {
  if (isEditorOpen.value) {
    emit('commitEdit');
  }
};

const cancelEditor = () => {
  if (isEditorOpen.value) {
    isCancellationRequested.value = true;
    emit('cancelEdit');
  }
};

const onEditorShowUpdate = (isShown: boolean) => {
  if (!isShown) {
    cancelEditor();
  }
};

const onRootClick = async () => {
  await activateInlineValue();
};

const onRootKeydown = async (event: KeyboardEvent) => {
  if (!['Enter', ' '].includes(event.key)) {
    return;
  }

  if (!isInteractionEnabled.value) {
    return;
  }

  event.preventDefault();
  await activateInlineValue();
};

onBeforeUnmount(() => {
  // A virtual range update can unmount this cell without a component-level close event. The
  // widget-owned session already holds its draft, so resolving here uses the same normal commit
  // path instead of silently discarding it.
  if (!isCancellationRequested.value && isEditorOpen.value) {
    commitEditor();
  }
});

const inlineEl = useTemplateRef<HTMLElement>('inlineEl');
const { width: inlineWidth } = useElementSize(inlineEl);

const onUpdateProperty = (nextProperty: DatabaseUnknownProperty) => {
  emit('update:property', nextProperty);
};

const onUpdateEditorValue = (draft: unknown) => {
  editorValue.value = draft;
};

const stringInputSize = computed(() => {
  if (!isStringProperty.value) {
    return undefined;
  }

  const currentValue = editorValue.value;
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

const interactiveRole = computed(() =>
  isInteractionEnabled.value ? (isBooleanProperty.value ? 'checkbox' : 'button') : undefined,
);

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
    :tabindex="isInteractionEnabled ? 0 : undefined"
    :role="interactiveRole"
    :aria-checked="ariaChecked"
    :aria-haspopup="isInteractionEnabled && !isBooleanProperty ? 'dialog' : undefined"
    :aria-expanded="isBooleanProperty ? undefined : isEditorOpen"
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
    :show="isEditorOpen"
    :target-element="inlineEl"
    @update:show="onEditorShowUpdate"
    @interaction-outside="commitEditor"
  >
    <div class="editable-inline-value__edit-popover" :style="editPopoverStyle">
      <DatabasePropertyValueFieldById
        :value="editorValue"
        class="editable-inline-value__value-field"
        :directory-path="path"
        :document-id="documentId"
        :property-id="propertyId"
        :input-size="stringInputSize ?? 0"
        autofocus
        @update:value="onUpdateEditorValue"
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
    min-height: 0;
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
