<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { type MaybeElement } from '@vueuse/core';
import { zodBooleanProperty } from '@entity/databaseBoolean/boolean';
import { zodIs } from '@shared/lib/validateZodScheme';
import ValueInline from './ValueInline.vue';
import { useBooleanEdit } from '@feature/booleanPropertyEdit';
import { isEqual } from 'es-toolkit';
import ValueField from './ValueField.vue';
import { onInteractionOutside } from '@shared/lib/onInteractionOutside';
import { useFirstFocus } from '@shared/lib/useFirstFocus';
import { PopOver } from '@shared/ui/PopOver';
import type {
  DatabaseItem,
  DatabasePropertyId,
  GeneralProperty,
} from '@shared/lib/databaseDocument';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';

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

const positionEditForm = ref<{
  clientY: number;
  clientX: number;
}>();

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

const onClick = ({ target }: MouseEvent) => {
  if (zodIs(property, zodBooleanProperty)) {
    toggleBoolean();
    tryEmitValue();
    return;
  }

  if (target instanceof HTMLElement) {
    const { top, left } = target.getBoundingClientRect();

    positionEditForm.value = {
      clientY: top,
      clientX: left,
    };
  }
};

const refPopover = ref<MaybeElement>();

const closeEditor = () => {
  tryEmitValue();

  positionEditForm.value = undefined;
};

onInteractionOutside(refPopover, closeEditor);

useFirstFocus(refPopover, { initialValue: true });
</script>

<template>
  <a class="editable-inline-value" tabindex="0" @click="onClick">
    <ValueInline :property :value="initialValue" />
  </a>

  <PopOver
    v-if="positionEditForm"
    v-model:ref-el="refPopover"
    :origin-position="positionEditForm"
  >
    <!-- TODO: Изменить позиционирование PopOver как у tooltip, но с управлением приоритетного расположения -->

    <div class="editable-inline-value__edit-popover">
      <ValueField
        v-model:value="stateValue"
        :property
        :directory
        @keydown.enter="closeEditor"
      />
    </div>
  </PopOver>
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
    --md-container-color: var(--md-sys-color-background);
    --md-content-color: var(--md-sys-color-on-background);
    padding: 8px;
    border-radius: 8px;
    box-shadow: var(--md-sys-elevation-level1);
  }
}
</style>
