<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import type { CFRDocument, DocumentFolder } from '../../shared/lib/cfrDocument';
import { DATABASE_DOCUMENT_TYPE } from '../../shared/lib/databaseDocument';

const props = defineProps<{
  documentFolder: DocumentFolder;
}>();

const emit = defineEmits<{
  created: [cfrDocument: CFRDocument];
  cancel: [];
}>();

const stateName = ref<string>();

const onSubmitCreate = () => {
  if (!stateName.value?.length) {
    throw new Error('name is undefined');
  }
  const newCFRDocument: CFRDocument = props.documentFolder.create({
    name: stateName.value,
    type: documentType.value,
  });

  emit('created', newCFRDocument);
};

const onResetCreate = () => {
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
  <form
    class="block-spacing is-flex is-flex-direction-column"
    @submit="onSubmitCreate"
    @reset="onResetCreate"
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

    <div class="field is-grouped">
      <div class="control">
        <button class="button is-link" type="submit">Create</button>
      </div>

      <div class="control">
        <button class="button is-link is-light" type="reset">Cancel</button>
      </div>
    </div>
  </form>
</template>
