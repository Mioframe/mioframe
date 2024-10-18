<script setup lang="ts">
import { ref } from 'vue';
import { type UnknownProperty } from '../../shared/lib/databaseDocument';
import { PopOver } from '../../shared/ui/PopOver';
import { BooleanPropertyField } from '../../features/booleanPropertyEdit';
import { onInteractionOutside } from '../../shared/lib/onInteractionOutside';
import { type MaybeElement } from '@vueuse/core';
import { NumberPropertyField } from '../../features/numberPropertyEdit';
import { StingPropertyField } from '../../features/stringPropertyEdit';
import { useFirstFocus } from '../../shared/lib/useFirstFocus';
import { PROPERTY_TYPE_STRING } from '@entity/stringProperty';
import { PROPERTY_TYPE_BOOLEAN } from '@entity/booleanProperty/boolean';
import { PROPERTY_TYPE_NUMBER } from '@entity/numberProperty/number';
import { BooleanValue } from '@entity/booleanProperty';
import { NumberValue } from '@entity/numberProperty';
import { StringValue } from '@entity/stringProperty';
import { PROPERTY_TYPE_DATE } from '@entity/dateProperty/date';
import { DateValue } from '@entity/dateProperty';
import { DatePropertyField } from '@feature/datePropertyEdit';
import { isEqual } from 'lodash-es';

const props = defineProps<{
  property: UnknownProperty;
  value: unknown;
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
  if (!props.editable) {
    return;
  }
  if (target instanceof HTMLElement) {
    const { top, left } = target.getBoundingClientRect();

    stateValue.value = props.value;

    positionEditForm.value = {
      clientY: top,
      clientX: left,
    };
  }
};

const refPopover = ref<MaybeElement>();

const closeEditor = () => {
  if (!isEqual(props.value, stateValue.value)) {
    emit('update:value', stateValue.value);
  }

  positionEditForm.value = undefined;
  stateValue.value = undefined;
};

onInteractionOutside(refPopover, closeEditor);

useFirstFocus(refPopover, { initialValue: true });

const stateValue = ref<unknown>();
</script>

<template>
  <component
    :is="editable ? 'a' : 'span'"
    class="value-widget-inline"
    :class="[
      $attrs.class,
      {
        '_editable is-text': editable,
      },
    ]"
    :tabindex="editable ? 0 : undefined"
    @click="onClickRoot"
  >
    <BooleanValue v-if="property?.type === PROPERTY_TYPE_BOOLEAN" :value />

    <NumberValue v-else-if="property?.type === PROPERTY_TYPE_NUMBER" :value />

    <StringValue v-else-if="property?.type === PROPERTY_TYPE_STRING" :value />

    <DateValue v-else-if="property?.type === PROPERTY_TYPE_DATE" :value />
  </component>

  <PopOver
    v-if="positionEditForm"
    v-model:ref-el="refPopover"
    :origin-position="positionEditForm"
  >
    <div class="card value-widget-inline__edit-popover">
      <div class="card-content">
        <BooleanPropertyField
          v-if="property?.type === PROPERTY_TYPE_BOOLEAN"
          v-model:value="stateValue"
          :label="property.name"
          @keydown.enter="closeEditor"
        />

        <NumberPropertyField
          v-else-if="property?.type === PROPERTY_TYPE_NUMBER"
          v-model:value="stateValue"
          :label="property.name"
          @keydown.enter="closeEditor"
        />

        <StingPropertyField
          v-else-if="property?.type === PROPERTY_TYPE_STRING"
          v-model:value="stateValue"
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
    </div>
  </PopOver>
</template>

<style lang="scss" scoped>
.value-widget-inline {
  &._editable {
    cursor: pointer;
    border-radius: var(--bulma-control-radius);
    color: inherit;
  }

  &__edit-popover {
    --bulma-card-content-padding: 0.5rem;
    --bulma-card-radius: calc(var(--bulma-card-content-padding / 2));
  }
}
</style>
