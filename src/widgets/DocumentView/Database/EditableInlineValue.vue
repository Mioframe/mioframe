<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue';
import { PopOver } from '../../../shared/ui/PopOver';
import { onInteractionOutside } from '../../../shared/lib/onInteractionOutside';
import { type MaybeElement } from '@vueuse/core';
import { useFirstFocus } from '../../../shared/lib/useFirstFocus';
import { zodStringProperty } from '@entity/stringProperty';
import { zodBooleanProperty } from '@entity/booleanProperty/boolean';
import { zodNumberProperty } from '@entity/numberProperty/number';
import { zodDateProperty } from '@entity/dateProperty/date';
import { is } from '@shared/lib/validateZodScheme';
import {
  NumberPropertyField,
  StringPropertyField,
  BooleanPropertyField,
  DatePropertyField,
} from '@feature/databaseItemEdit';
import type { GeneralProperty } from '@shared/lib/databaseDocument/state/v1/property';
import ValueInline from './ValueInline.vue';
import { useBooleanEdit } from '@feature/booleanPropertyEdit';
import type {
  DatabaseItem,
  DatabasePropertyId,
} from '@shared/lib/databaseDocument/state';
import { isDeepEqual } from 'remeda';

const {
  item = {},
  property,
  propertyId,
} = defineProps<{
  item: DatabaseItem | undefined;
  property: GeneralProperty;
  propertyId: DatabasePropertyId;
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
  if (!isDeepEqual(item[propertyId], stateValue.value)) {
    emit('update:value', stateValue.value);
  }
};

const { toggleBoolean } = useBooleanEdit(stateValue);

const onClick = ({ target }: MouseEvent) => {
  if (is(property, zodBooleanProperty)) {
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
    <div class="editable-inline-value__edit-popover">
      <BooleanPropertyField
        v-if="is(property, zodBooleanProperty)"
        v-model="stateValue"
        :property
        :label="property.name"
        @keydown.enter="closeEditor"
      />

      <NumberPropertyField
        v-else-if="is(property, zodNumberProperty)"
        v-model="stateValue"
        :property
        :label="property.name"
        @keydown.enter="closeEditor"
      />

      <StringPropertyField
        v-else-if="is(property, zodStringProperty)"
        v-model="stateValue"
        :property
        :label="property.name"
        @keydown.enter="closeEditor"
      />

      <DatePropertyField
        v-else-if="is(property, zodDateProperty)"
        v-model="stateValue"
        :property
        :label="property.name"
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
