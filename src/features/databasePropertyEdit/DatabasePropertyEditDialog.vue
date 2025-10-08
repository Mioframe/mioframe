<script setup lang="ts">
import { computed, ref, toRefs, watchEffect } from 'vue';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { cloneDeep } from 'es-toolkit';
import { useSnackbar } from '@shared/ui/Snackbar';
import type { AMDocumentId } from '@shared/lib/automerge';
import type {
  DatabasePropertyId,
  DatabaseUnknownProperty,
} from '@shared/lib/databaseDocument';
import type { EntryPath } from '@shared/lib/fileSystem';
import { useDatabasePropertiesClient } from '@entity/databaseProperty';
import { DomainError } from '@shared/lib/error';
const props = defineProps<{
  directoryPath: EntryPath;
  documentId: AMDocumentId;
  propertyId: DatabasePropertyId;
}>();

const { directoryPath, documentId, propertyId } = toRefs(props);

const emit = defineEmits<{
  edited: [];
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

const { getProperty, patch } = useDatabasePropertiesClient();

const property = computed(() =>
  getProperty(directoryPath.value, documentId.value, propertyId.value),
);

const propertyState = ref<DatabaseUnknownProperty>();

const resetPropertyState = () => {
  if (property.value && !(property.value instanceof DomainError)) {
    propertyState.value = cloneDeep(property.value);
  } else {
    propertyState.value = undefined;
  }
};

watchEffect(() => {
  resetPropertyState();
});

const onUpdateDefaultValue = (value: unknown) => {
  if (propertyState.value) {
    propertyState.value.default = value;
  }
};

const { addSnackbar } = useSnackbar();

const onApply = async () => {
  if (propertyState.value) {
    await patch(
      directoryPath.value,
      documentId.value,
      propertyId.value,
      propertyState.value,
    );
    emit('edited');
  } else {
    addSnackbar({ text: 'Property is not filled' });
  }
};

const onCancel = () => {
  resetPropertyState();
  emit('cancel');
};

const onUpdateProperty = (v: DatabaseUnknownProperty) => {
  propertyState.value = v;
};
</script>

<template>
  <MDDialog
    v-model:show="showModel"
    headline="Edit Property"
    supporting-text="Change the property settings."
    apply-label="Edit"
    cancel-label="Cancel"
    has-cancel-action
    @apply="onApply"
    @cancel="onCancel"
  >
    <template v-if="propertyState">
      <MDTextField
        v-model:model-value="propertyState.name"
        label-text="Name"
        class="database-property-creation__field"
      />

      <slot
        name="after"
        :property="propertyState"
        :on-update-default-value="onUpdateDefaultValue"
        :on-update-property="onUpdateProperty"
      />
    </template>

    <span v-else> original property not found </span>
  </MDDialog>
</template>
