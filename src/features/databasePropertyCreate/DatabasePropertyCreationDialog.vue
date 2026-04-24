<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { MDSelectBase, MDSelectOption } from '@shared/ui/Select';
import type { PartialDeep } from 'type-fest';
import { PROPERTY_TYPE_BOOLEAN, createBooleanProperty } from '@entity/databaseBoolean';
import { PROPERTY_TYPE_DATE, createDateProperty } from '@entity/databaseDate';
import { PROPERTY_TYPE_NUMBER, createNumberProperty } from '@entity/databaseNumber';
import { PROPERTY_TYPE_RELATION, createRelationProperty } from '@entity/databaseRelation';
import { PROPERTY_TYPE_STRING, createStringProperty } from '@entity/databaseString';
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

const emit = defineEmits<{
  created: [payload: { id: DatabasePropertyId; property: DatabaseUnknownProperty }];
  cancel: [];
}>();

defineSlots<{
  after: (p: {
    property: DatabaseUnknownProperty;
    onUpdateDefaultValue: (v: unknown) => void;
    onUpdateProperty: (v: DatabaseUnknownProperty) => void;
  }) => unknown;
}>();

const { path, documentId } = toRefs(props);
const propertyTypeOptions = [
  {
    createProperty: createStringProperty,
    label: 'string',
    type: PROPERTY_TYPE_STRING,
  },
  {
    createProperty: createNumberProperty,
    label: 'number',
    type: PROPERTY_TYPE_NUMBER,
  },
  {
    createProperty: createBooleanProperty,
    label: 'boolean',
    type: PROPERTY_TYPE_BOOLEAN,
  },
  {
    createProperty: createDateProperty,
    label: 'date',
    type: PROPERTY_TYPE_DATE,
  },
  {
    createProperty: createRelationProperty,
    label: 'relation',
    type: PROPERTY_TYPE_RELATION,
  },
] as const;

type PropertyDraft = PartialDeep<Omit<DatabaseUnknownProperty, 'name' | 'type'>> & {
  name?: string | undefined;
  type?: DatabaseUnknownProperty['type'] | undefined;
};

const partialPropertyState = ref<PropertyDraft>({});

const typeSelect = ref<(string | number)[]>([propertyTypeOptions[0].type]);

const selectedPropertyDescriptor = computed(() => {
  const type = typeSelect.value.at(0);

  return propertyTypeOptions.find((descriptor) => descriptor.type === type);
});

watch(
  selectedPropertyDescriptor,
  (descriptor) => {
    if (!descriptor) {
      return;
    }

    partialPropertyState.value = {
      ...descriptor.createProperty(partialPropertyState.value.name ?? ''),
      default: partialPropertyState.value.default,
    };
  },
  { immediate: true },
);

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
    emit('created', { id, property: assembledProperty.value });
  } else {
    addSnackbar({ text: 'Property is not fully filled' });
  }
};

const resetState = () => {
  partialPropertyState.value = {};
  typeSelect.value = [propertyTypeOptions[0].type];
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

const propertyNameModel = computed<string | undefined>({
  get: () => partialPropertyState.value.name,
  set: (name) => {
    partialPropertyState.value.name = name;
  },
});
</script>

<template>
  <MDDialog
    headline="Create Property"
    supporting-text="Enter a name and select the type of the new property."
    apply-label="Create"
    cancel-label="Cancel"
    has-cancel-action
    @apply="onCreate"
    @cancel="onCancel"
  >
    <MDTextField
      v-model:model-value="propertyNameModel"
      label-text="Name"
      class="database-property-creation__field"
    />

    <MDSelectBase
      v-model:model-value="typeSelect"
      class="database-property-creation__field"
      label-text="Property type"
    >
      <template #valueContainer>
        <span class="database-property-creation__type-value">
          {{ typeSelect.at(0) }}
        </span>
      </template>

      <template #options>
        <MDSelectOption
          v-for="descriptor in propertyTypeOptions"
          :key="descriptor.type"
          :value="descriptor.type"
          :label="descriptor.label"
        />
      </template>
    </MDSelectBase>

    <slot
      v-if="assembledProperty"
      name="after"
      :property="assembledProperty"
      :on-update-default-value="onUpdateDefaultValue"
      :on-update-property="onUpdateProperty"
    />
  </MDDialog>
</template>

<style lang="css" scoped>
.database-property-creation {
  &__type-value {
    &::first-letter {
      text-transform: uppercase;
    }
  }
}
</style>
