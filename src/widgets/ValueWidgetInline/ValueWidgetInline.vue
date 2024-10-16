<script setup lang="ts">
import { ref } from 'vue';
import { type UnknownProperty } from '../../shared/lib/databaseDocument';
import PopOver from '../../shared/ui/PopOver/PopOver.vue';
import { BooleanPropertyField } from '../../features/booleanPropertyEdit';
import { onInteractionOutside } from '../../shared/lib/onInteractionOutside';
import { type MaybeElement } from '@vueuse/core';
import { NumberPropertyField } from '../../features/numberPropertyEdit';
import { StingPropertyField } from '../../features/stringPropertyEdit';
import { useFirstFocus } from '../../shared/lib/useFirstFocus';
import { PROPERTY_TYPE_STRING } from '@entity/stringProperty';
import { PROPERTY_TYPE_BOOLEAN } from '@entity/booleanProperty/boolean';
import { PROPERTY_TYPE_NUMBER } from '@entity/numberProperty/number';
import BooleanValue from '@entity/booleanProperty/BooleanValue.vue';
import NumberValue from '@entity/numberProperty/NumberValue.vue';
import StringValue from '@entity/stringProperty/StringValue.vue';
import { PROPERTY_TYPE_DATE } from '@entity/dateProperty/date';
import DateValue from '@entity/dateProperty/DateValue.vue';
import { DatePropertyField } from '@feature/datePropertyEdit';

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

    positionEditForm.value = {
      clientY: top,
      clientX: left,
    };
  }
};

const onUpdateValue = (v: unknown) => {
  emit('update:value', v);
};

const refPopover = ref<MaybeElement>();

onInteractionOutside(refPopover, () => {
  positionEditForm.value = undefined;
});

useFirstFocus(refPopover, { initialValue: true });
</script>

<template>
  <span
    class="value-widget-inline"
    :class="{
      _editable: editable,
    }"
    :tabindex="editable ? 0 : undefined"
    @click="onClickRoot"
  >
    <BooleanValue v-if="property?.type === PROPERTY_TYPE_BOOLEAN" :value />

    <NumberValue v-else-if="property?.type === PROPERTY_TYPE_NUMBER" :value />

    <StringValue v-else-if="property?.type === PROPERTY_TYPE_STRING" :value />

    <DateValue v-else-if="property?.type === PROPERTY_TYPE_DATE" :value />

    <PopOver
      v-if="positionEditForm"
      v-model:ref-el="refPopover"
      :origin-position="positionEditForm"
    >
      <div class="card value-widget-inline__edit-popover">
        <div class="card-content">
          <BooleanPropertyField
            v-if="property?.type === PROPERTY_TYPE_BOOLEAN"
            :value
            :label="property.name"
            @update:value="onUpdateValue"
          />

          <NumberPropertyField
            v-else-if="property?.type === PROPERTY_TYPE_NUMBER"
            :value
            :label="property.name"
            @update:value="onUpdateValue"
          />

          <StingPropertyField
            v-else-if="property?.type === PROPERTY_TYPE_STRING"
            :value
            :label="property.name"
            @update:value="onUpdateValue"
          />

          <DatePropertyField
            v-else-if="property?.type === PROPERTY_TYPE_DATE"
            :value
            :label="property.name"
            @update:value="onUpdateValue"
          />
        </div>
      </div>
    </PopOver>
  </span>
</template>

<style lang="scss" scoped>
.value-widget-inline {
  &._editable {
    cursor: pointer;
  }

  &__edit-popover {
    --bulma-card-content-padding: 0.5rem;
    --bulma-card-radius: calc(var(--bulma-card-content-padding / 2));
  }
}
</style>
