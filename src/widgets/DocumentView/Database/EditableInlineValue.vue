<script setup lang="ts">
import { computed, ref, useTemplateRef, watch, watchEffect } from 'vue';
import { zodBooleanProperty } from '@entity/databaseBoolean/boolean';
import { zodIs } from '@shared/lib/validateZodScheme';
import ValueInline from './ValueInline.vue';
import { useBooleanEdit } from '@feature/booleanPropertyEdit';
import { isEqual } from 'es-toolkit';
import ValueField from './ValueField.vue';
import { useFirstFocus } from '@shared/lib/useFirstFocus';
import type {
  DatabaseItem,
  DatabasePropertyId,
  GeneralProperty,
} from '@shared/lib/databaseDocument';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { MDOverlayTooltip } from '@shared/ui/Tooltips';

const {
  item = {},
  property,
  propertyId,
} = defineProps<{
  item: DatabaseItem | undefined;
  property: GeneralProperty;
  propertyId: DatabasePropertyId;
  directory: DirectoryFSEntry;
}>();

const emit = defineEmits<{
  'update:value': [value: unknown];
}>();

const initialValue = computed(() => item[propertyId]);

const showEditForm = ref(false);

const stateValue = ref<unknown>();

watchEffect(() => {
  stateValue.value = initialValue.value;
});

const tryEmitValue = () => {
  if (!isEqual(item[propertyId], stateValue.value)) {
    emit('update:value', stateValue.value);
  }
};

const { toggleBoolean } = useBooleanEdit(stateValue);

const onClick = () => {
  if (zodIs(property, zodBooleanProperty)) {
    toggleBoolean();
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

const inlineEl = useTemplateRef('inlineEl');
</script>

<template>
  <a ref="inlineEl" class="editable-inline-value" tabindex="0" @click="onClick">
    <ValueInline :property :value="initialValue" editable />
  </a>

  <MDOverlayTooltip
    v-model:show="showEditForm"
    :target-element="inlineEl"
    @interaction-outside="closeEditor"
  >
    <div ref="refPopover" class="editable-inline-value__edit-popover">
      <ValueField
        v-model:value="stateValue"
        :property
        :directory
        @keydown.enter="closeEditor"
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

  &:hover {
    text-decoration-color: rgb(from var(--md-content-color) r g b / 0.5);
  }

  &__edit-popover {
    /* --md-container-color: var(--md-sys-color-background);
    --md-content-color: var(--md-sys-color-on-background); */
    /* padding: 8px; */
    /* border-radius: 8px; */
    /* box-shadow: var(--md-sys-elevation-level1); */
  }
}
</style>
