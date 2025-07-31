<script setup lang="ts">
import { computed, ref, useTemplateRef, watch, watchEffect } from 'vue';
import { zodBooleanProperty } from '@entity/databaseBoolean/boolean';
import { zodIs } from '@shared/lib/validateZodScheme';
import ValueInline from './ValueInline.vue';
import { isEqual, isUndefined } from 'es-toolkit';
import ValueField from './ValueField.vue';
import { useFirstFocus } from '@shared/lib/useFirstFocus';
import type {
  DatabaseItem,
  DatabasePropertyId,
  DatabaseUnknownProperty,
  GeneralProperty,
} from '@shared/lib/databaseDocument';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';
import { MDOverlayTooltip } from '@shared/ui/Tooltips';
import { toggleBoolean } from '@shared/ui/Checkbox';

const {
  item = {},
  property,
  propertyId,
} = defineProps<{
  // eslint-disable-next-line vue/no-required-prop-with-default -- non-optional prop
  item: DatabaseItem | undefined;
  property: GeneralProperty;
  propertyId: DatabasePropertyId;
  directory: DirectoryFSEntry;
}>();

const emit = defineEmits<{
  'update:value': [value: unknown];
  'update:property': [property: DatabaseUnknownProperty];
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

const onClick = () => {
  if (zodIs(property, zodBooleanProperty)) {
    stateValue.value = toggleBoolean(
      isUndefined(stateValue.value) ? stateValue.value : !!stateValue.value,
      property.indeterminate,
    );
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

const onUpdateProperty = (v: DatabaseUnknownProperty) => {
  emit('update:property', v);
};
</script>

<template>
  <a
    ref="inlineEl"
    class="editable-inline-value md"
    tabindex="0"
    @click="onClick"
  >
    <ValueInline
      :property="property"
      :value="initialValue"
      editable
      :directory="directory"
      @click="onClick"
    />
  </a>

  <MDOverlayTooltip
    v-model:show="showEditForm"
    :target-element="inlineEl"
    @interaction-outside="closeEditor"
  >
    <div ref="refPopover" class="editable-inline-value__edit-popover">
      <ValueField
        v-model:value="stateValue"
        class="editable-inline-value__value-field"
        :property="property"
        :directory="directory"
        @keydown.enter="closeEditor"
        @update:property="onUpdateProperty"
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
    display: flex;
    flex-direction: column;
    overflow: auto;
    padding-top: 1step;
  }
}
</style>
