<script setup lang="ts">
import { ref } from 'vue';
import {
  ValueBooleanInline,
  ValueNumberInline,
  ValueStringInline,
} from '../../entities/value';
import {
  type AnyProperty,
  PROPERTY_TYPE_BOOLEAN,
  PROPERTY_TYPE_NUMBER,
  PROPERTY_TYPE_STRING,
} from '../../shared/lib/databaseDocument';
import PopOver from '../../shared/ui/PopOver/PopOver.vue';
import { PropertyBooleanField } from '../../features/propertyBooleanEdit';
import { onInteractionOutside } from '../../shared/lib/onInteractionOutside';
import { type MaybeElement } from '@vueuse/core';
import { PropertyNumberField } from '../../features/propertyNumberEdit';
import { PropertyStingField } from '../../features/propertyStringEdit';
import { useFirstFocus } from '../../shared/lib/useFirstFocus';

const props = defineProps<{
  property: AnyProperty;
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
    <ValueBooleanInline
      v-if="property?.type === PROPERTY_TYPE_BOOLEAN"
      :value
    />

    <ValueNumberInline
      v-else-if="property?.type === PROPERTY_TYPE_NUMBER"
      :value
    />

    <ValueStringInline
      v-else-if="property?.type === PROPERTY_TYPE_STRING"
      :value
    />

    <PopOver
      v-if="positionEditForm"
      v-model:ref-el="refPopover"
      :origin-position="positionEditForm"
    >
      <div class="card value-widget-inline__edit-popover">
        <div class="card-content">
          <PropertyBooleanField
            v-if="property?.type === PROPERTY_TYPE_BOOLEAN"
            :value
            :label="property.name"
            @update:value="onUpdateValue"
          />

          <PropertyNumberField
            v-else-if="property?.type === PROPERTY_TYPE_NUMBER"
            :value
            :label="property.name"
            @update:value="onUpdateValue"
          />

          <PropertyStingField
            v-else-if="property?.type === PROPERTY_TYPE_STRING"
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
