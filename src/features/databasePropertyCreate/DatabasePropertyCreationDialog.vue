<script setup lang="ts">
import { computed, ref } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { MDSelect } from '@shared/ui/Select';
import type { StringProperty } from '@entity/databaseString';
import { PROPERTY_TYPE_STRING } from '@entity/databaseString';
import type { NumberProperty } from '@entity/databaseNumber';
import { PROPERTY_TYPE_NUMBER } from '@entity/databaseNumber';
import type { BooleanProperty } from '@entity/databaseBoolean';
import { PROPERTY_TYPE_BOOLEAN } from '@entity/databaseBoolean';
import type { DateProperty } from '@entity/databaseDate';
import { PROPERTY_TYPE_DATE } from '@entity/databaseDate';
import type { ValueOf } from 'type-fest';
import type { Relation, RelationProperty } from '@entity/databaseRelation';
import { PROPERTY_TYPE_RELATION } from '@entity/databaseRelation/model';
import { objectEntries } from '@shared/lib/objectEntries';
import { pascalCase } from 'es-toolkit';
import { useSnackbar } from '@shared/ui/Snackbar';
import DatabaseRelationPropertyField from '@feature/databaseRelationPropertyEdit/DatabaseRelationPropertyField.vue';
import type { DirectoryFSEntry } from '@shared/lib/fileSystem';

const { directory } = defineProps<{
  directory: DirectoryFSEntry;
}>();

const emit = defineEmits<{
  create: [
    property:
      | StringProperty
      | NumberProperty
      | BooleanProperty
      | DateProperty
      | RelationProperty,
  ];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });

const stateName = ref<string>();

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

const typeSelectModel = ref<PropertyTypeOption[]>([propertyTypeOptions[0]]);

const selectedPropertyType = computed(
  () => typeSelectModel.value.at(0)?.propertyType,
);

const relationModel = ref<Relation>();

const newProperty = computed(
  ():
    | undefined
    | StringProperty
    | NumberProperty
    | BooleanProperty
    | DateProperty
    | RelationProperty => {
    const name = stateName.value;
    const type = selectedPropertyType.value;

    if (name && type) {
      if (type === PROPERTY_TYPE_RELATION) {
        if (relationModel.value) {
          return {
            name,
            type,
            relation: relationModel.value,
          };
        }
      } else {
        return {
          name,
          type,
        };
      }
    }
    return undefined;
  },
);

const { addSnackbar } = useSnackbar();

const onCreate = () => {
  if (newProperty.value) {
    emit('create', newProperty.value);
  } else {
    addSnackbar({ text: 'Property is not fully filled' });
  }
};

const onCancel = () => {
  stateName.value = undefined;
  typeSelectModel.value = [];
  emit('cancel');
};
</script>

<template>
  <MDDialog
    v-model:show="show"
    headline="Create Property"
    supporting-text="Enter a name and select the type of the new property."
    apply-label="Create"
    cancel-label="Cancel"
    has-cancel-action
    @apply="onCreate"
    @cancel="onCancel"
  >
    <MDTextField
      v-model:model-value="stateName"
      label-text="Name"
      class="database-property-creation__field"
    />

    <MDSelect
      v-model:model-value="typeSelectModel"
      class="database-property-creation__field"
      label-text="Property type"
      :options="propertyTypeOptions"
    />

    <DatabaseRelationPropertyField
      v-if="selectedPropertyType === PROPERTY_TYPE_RELATION"
      v-model:model-value="relationModel"
      :directory="directory"
    />
  </MDDialog>
</template>
