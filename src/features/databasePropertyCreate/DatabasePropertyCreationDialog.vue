<script setup lang="ts">
import { computed, ref, toRefs, watchEffect } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { MDSelect } from '@shared/ui/Select';
import { PROPERTY_TYPE_STRING } from '@entity/databaseString';
import { PROPERTY_TYPE_NUMBER } from '@entity/databaseNumber';
import { PROPERTY_TYPE_BOOLEAN } from '@entity/databaseBoolean';
import { PROPERTY_TYPE_DATE } from '@entity/databaseDate';
import type { PartialDeep } from 'type-fest';
import { type ValueOf } from 'type-fest';
import { PROPERTY_TYPE_RELATION } from '@entity/databaseRelation/model';
import { objectEntries } from '@shared/lib/objectEntries';
import { pascalCase } from 'es-toolkit';
import { useSnackbar } from '@shared/ui/Snackbar';
import type { AMDocumentId } from '@shared/lib/automerge';
import {
  zodDatabaseUnknownProperty,
  type DatabasePropertyId,
  type DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import { zodIs } from '@shared/lib/validateZodScheme';
import { useDatabaseProperties } from '@entity/databaseProperty';

const props = defineProps<{
  path: string;
  documentId: AMDocumentId;
}>();

const { path, documentId } = toRefs(props);

const emit = defineEmits<{
  created: [id: DatabasePropertyId, property: DatabaseUnknownProperty];
  cancel: [];
}>();

const showModel = defineModel<boolean>('show', { required: true });

defineSlots<{
  after: (p: {
    property: DatabaseUnknownProperty;
    onUpdateDefaultValue: (v: unknown) => void;
    onUpdateProperty: (v: DatabaseUnknownProperty) => void;
  }) => unknown;
}>();

const propertyTypeList = {
  PROPERTY_TYPE_STRING,
  PROPERTY_TYPE_NUMBER,
  PROPERTY_TYPE_BOOLEAN,
  PROPERTY_TYPE_DATE,
  PROPERTY_TYPE_RELATION,
} as const;

type PropertyType = ValueOf<typeof propertyTypeList>;

type PropertyTypeOption = {
  label: string;
  propertyType: PropertyType;
  key: string;
};

const propertyTypeOptions = objectEntries(propertyTypeList).reduce<
  PropertyTypeOption[]
>((acc, [key, value]) => {
  acc.push({
    label: pascalCase(value),
    propertyType: value,
    key,
  });
  return acc;
}, []);

const partialPropertyState = ref<PartialDeep<DatabaseUnknownProperty>>({});

const typeSelectModel = ref<PropertyTypeOption[]>([propertyTypeOptions[0]]);

watchEffect(() => {
  partialPropertyState.value.type = typeSelectModel.value.at(0)?.propertyType;
});

const onUpdateDefaultValue = (value: unknown) => {
  partialPropertyState.value.default = value;
};

const assembledProperty = computed((): undefined | DatabaseUnknownProperty => {
  return zodIs(partialPropertyState.value, zodDatabaseUnknownProperty)
    ? partialPropertyState.value
    : undefined;
});

const { addSnackbar } = useSnackbar();

const { post } = useDatabaseProperties(path, documentId);

const onCreate = async () => {
  if (assembledProperty.value) {
    const id = await post(assembledProperty.value);
    emit('created', id, assembledProperty.value);
  } else {
    addSnackbar({ text: 'Property is not fully filled' });
  }
};

const resetState = () => {
  partialPropertyState.value = {};
  typeSelectModel.value = [propertyTypeOptions[0]];
};

const onCancel = () => {
  resetState();
  emit('cancel');
};

const onUpdateProperty = (v: DatabaseUnknownProperty) => {
  partialPropertyState.value = {
    ...v,
    name: partialPropertyState.value.name,
    type: partialPropertyState.value.type,
  };
};

watchEffect(() => {
  if (!showModel.value) {
    resetState();
  }
});
</script>

<template>
  <MDDialog
    v-model:show="showModel"
    headline="Create Property"
    supporting-text="Enter a name and select the type of the new property."
    apply-label="Create"
    cancel-label="Cancel"
    has-cancel-action
    @apply="onCreate"
    @cancel="onCancel"
  >
    <MDTextField
      v-model:model-value="partialPropertyState.name"
      label-text="Name"
      class="database-property-creation__field"
    />

    <MDSelect
      v-model:model-value="typeSelectModel"
      class="database-property-creation__field"
      label-text="Property type"
      :options="propertyTypeOptions"
    />

    <slot
      v-if="assembledProperty"
      name="after"
      :property="assembledProperty"
      :on-update-default-value="onUpdateDefaultValue"
      :on-update-property="onUpdateProperty"
    />
  </MDDialog>
</template>
