<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { DocumentFolder } from '../../shared/lib/cfrDocument';
import { DATABASE_DOCUMENT_TYPE } from '../../shared/lib/databaseDocument';
import { MDDialog } from '@shared/ui/Dialog';

const props = defineProps<{
  folder: DocumentFolder;
}>();

const emit = defineEmits<{
  created: [];
  cancel: [];
}>();

const stateName = ref<string>();

const onCreate = () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }

  props.folder.createDocument({
    name: stateName.value,
    type: documentType.value,
    version: 1,
  });

  emit('created');
};

const onCancel = () => {
  stateName.value = undefined;
  emit('cancel');
};

const autofocusElement = ref<HTMLElement>();

watchEffect(() => {
  autofocusElement.value?.focus();
});

const documentTypeOptions = [DATABASE_DOCUMENT_TYPE, 'any'] as const;

const documentType = ref<(typeof documentTypeOptions)[number]>(
  documentTypeOptions[0],
);
</script>

<template>
  <MDDialog
    headline="Create Document"
    supporting-text="Think of a name and select the type of the new document."
    apply-label="Create"
    cancel-label="Cancel"
    has-cancel-action
    @apply="onCreate"
    @cancel="onCancel"
  >
    <div class="field">
      <label class="label">Name</label>

      <div class="control">
        <input
          ref="autofocusElement"
          v-model="stateName"
          name="name"
          class="input"
          type="text"
          placeholder="name of the new document"
          required
        />
      </div>
    </div>

    <div class="select">
      <select v-model="documentType">
        <option
          v-for="option in documentTypeOptions"
          :key="option"
          :value="option"
        >
          {{ option }}
        </option>
      </select>
    </div>
  </MDDialog>
</template>
