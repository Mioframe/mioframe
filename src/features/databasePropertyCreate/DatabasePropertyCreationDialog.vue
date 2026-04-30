<script setup lang="ts">
import { computed, ref, toRefs, watch } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { MDSelectBase, MDSelectOption } from '@shared/ui/Select';
import { useSnackbar } from '@shared/ui/Snackbar';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabasePropertyId, DatabaseUnknownProperty } from '@shared/lib/databaseDocument';
import { useDatabaseProperties } from '@entity/databaseProperty';
import {
  getCreatableProperty,
  getDraftProperty,
  getTypeSwitchedPropertyDraft,
  type PropertyDraft,
} from './model/propertyDraft';
import {
  databasePropertyCreateDescriptors,
  getDatabasePropertyCreateDescriptor,
} from './model/databasePropertyCreateDescriptors';

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
    submitProperty: DatabaseUnknownProperty | undefined;
    onUpdateDefaultValue: (v: unknown) => void;
    onUpdateProperty: (v: DatabaseUnknownProperty) => void;
  }) => unknown;
}>();

const { path, documentId } = toRefs(props);
const partialPropertyState = ref<PropertyDraft>({});
const defaultPropertyCreateDescriptor = databasePropertyCreateDescriptors[0]!;

const typeSelect = ref<(string | number)[]>([defaultPropertyCreateDescriptor.type]);

const selectedPropertyDescriptor = computed(() => {
  const type = typeSelect.value.at(0);

  return getDatabasePropertyCreateDescriptor(typeof type === 'string' ? type : undefined);
});

watch(
  selectedPropertyDescriptor,
  (descriptor) => {
    if (!descriptor) {
      return;
    }

    partialPropertyState.value = getTypeSwitchedPropertyDraft(
      partialPropertyState.value,
      descriptor.createDraftProperty,
    );
  },
  { immediate: true },
);

const onUpdateDefaultValue = (value: unknown) => {
  partialPropertyState.value.default = value;
};

const draftProperty = computed(() => getDraftProperty(partialPropertyState.value));

const submitProperty = computed(() => getCreatableProperty(partialPropertyState.value));

const { addSnackbar } = useSnackbar();

const { post } = useDatabaseProperties(path, documentId);

const onCreate = async () => {
  if (submitProperty.value) {
    const id = await post(submitProperty.value);
    emit('created', { id, property: submitProperty.value });
  } else {
    addSnackbar({ text: 'Property is not fully filled' });
  }
};

const resetState = () => {
  partialPropertyState.value = {};
  typeSelect.value = [defaultPropertyCreateDescriptor.type];
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
          v-for="descriptor in databasePropertyCreateDescriptors"
          :key="descriptor.type"
          :value="descriptor.type"
          :label="descriptor.label"
        />
      </template>
    </MDSelectBase>

    <slot
      v-if="draftProperty"
      name="after"
      :property="draftProperty"
      :submit-property="submitProperty"
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
