<script setup lang="ts">
import { computed, ref, toRefs, watchEffect } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { MDSelectBase, MDSelectOption } from '@shared/ui/Select';
import { PROPERTY_TYPE_STRING } from '@entity/databaseString';
import { PROPERTY_TYPE_NUMBER } from '@entity/databaseNumber';
import { PROPERTY_TYPE_BOOLEAN } from '@entity/databaseBoolean';
import { PROPERTY_TYPE_DATE } from '@entity/databaseDate';
import type { PartialDeep, ValueOf } from 'type-fest';
import { PROPERTY_TYPE_RELATION } from '@entity/databaseRelation/model';
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

defineSlots<{
  after: (p: {
    property: DatabaseUnknownProperty;
    onUpdateDefaultValue: (v: unknown) => void;
    onUpdateProperty: (v: DatabaseUnknownProperty) => void;
  }) => unknown;
}>();

const PROPERTY_TYPES = {
  PROPERTY_TYPE_STRING,
  PROPERTY_TYPE_NUMBER,
  PROPERTY_TYPE_BOOLEAN,
  PROPERTY_TYPE_DATE,
  PROPERTY_TYPE_RELATION,
} as const;

type PropertyDraft = PartialDeep<Omit<DatabaseUnknownProperty, 'name' | 'type'>> & {
  name?: string | undefined;
  type?: ValueOf<typeof PROPERTY_TYPES> | undefined;
};

const partialPropertyState = ref<PropertyDraft>({});

const typeSelect = ref<(string | number)[]>([PROPERTY_TYPES.PROPERTY_TYPE_STRING]);

const selectedPropertyType = computed<ValueOf<typeof PROPERTY_TYPES> | undefined>(() => {
  const type = typeSelect.value.at(0);

  return Object.values(PROPERTY_TYPES).find((propertyType) => propertyType === type);
});

watchEffect(() => {
  partialPropertyState.value.type = selectedPropertyType.value;
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
  typeSelect.value = [PROPERTY_TYPES.PROPERTY_TYPE_STRING];
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
          v-for="propertyType in PROPERTY_TYPES"
          :key="propertyType"
          :value="propertyType"
          :label="propertyType"
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
