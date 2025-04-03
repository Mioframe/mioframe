<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { PropertyId } from '../../../shared/lib/databaseDocument';
import { PopOver } from '../../../shared/ui/PopOver';
import { onInteractionOutside } from '../../../shared/lib/onInteractionOutside';
import { type MaybeElement } from '@vueuse/core';
import { useFirstFocus } from '../../../shared/lib/useFirstFocus';
import { zodStringProperty } from '@entity/stringProperty';
import { zodBooleanProperty } from '@entity/booleanProperty/boolean';
import { zodNumberProperty } from '@entity/numberProperty/number';
import { PROPERTY_TYPE_DATE } from '@entity/dateProperty/date';
import { DatePropertyField } from '@feature/datePropertyEdit';
import { isEqual } from 'lodash-es';
import BooleanPropertyField from '@feature/databaseItemAdd/BooleanPropertyField.vue';
import { is } from '@shared/lib/validateZodScheme';
import {
  NumberPropertyField,
  StringPropertyField,
} from '@feature/databaseItemAdd';
import type { DatabaseItem } from '@shared/lib/databaseDocument/item/data';
import type { GeneralProperty } from '@shared/lib/databaseDocument/property';
import ValueInline from './ValueInline.vue';

const {
  editable,
  item = {},
  property,
  propertyId,
} = defineProps<{
  item: DatabaseItem | undefined;
  property: GeneralProperty;
  propertyId: PropertyId;
  editable?: boolean;
}>();

const emit = defineEmits<{
  'update:value': [value: unknown];
}>();

const positionEditForm = ref<{
  clientY: number;
  clientX: number;
}>();

const onClickRoot = ({ target }: MouseEvent) => {
  if (!editable) {
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
  if (!isEqual(item[propertyId], stateValue.value)) {
    emit('update:value', stateValue.value);
  }

  positionEditForm.value = undefined;
  stateValue.value = undefined;
};

onInteractionOutside(refPopover, closeEditor);

useFirstFocus(refPopover, { initialValue: true });

const stateValue = ref<unknown>();

watchEffect(() => {
  stateValue.value = item[propertyId];
});
</script>

<template>
  <component
    :is="editable ? 'a' : 'span'"
    class="inline-value"
    :class="[
      $attrs.class,
      {
        'inline-value_editable': editable,
      },
    ]"
    :tabindex="editable ? 0 : undefined"
    @click="onClickRoot"
  >
    <ValueInline :property :value="stateValue" />
  </component>

  <PopOver
    v-if="positionEditForm"
    v-model:ref-el="refPopover"
    :origin-position="positionEditForm"
  >
    <div class="inline-value__edit-popover">
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
        v-else-if="property?.type === PROPERTY_TYPE_DATE"
        v-model:value="stateValue"
        :label="property.name"
        @keydown.enter="closeEditor"
      />
    </div>
  </PopOver>
</template>

<style scoped>
.inline-value {
  &_editable {
    cursor: pointer;
  }

  &__edit-popover {
    --md-container-color: var(--md-sys-color-background);
    padding: 8px;
    border-radius: 8px;
    box-shadow: var(--md-sys-elevation-level1);
  }
}
</style>
