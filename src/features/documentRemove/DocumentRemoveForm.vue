<script setup lang="ts">
import { ref } from 'vue';
import type { FolderApi } from '../../shared/lib/documentApi';
import type { DocumentId } from '@automerge/automerge-repo';

const props = defineProps<{
  folderApi: FolderApi;
  documentId: DocumentId;
  documentName?: string;
}>();

const emit = defineEmits<{
  cancel: [];
  removed: [];
}>();

const loading = ref(0);

const onSubmit = async () => {
  loading.value += 1;
  try {
    await props.folderApi.remove(props.documentId);
    emit('removed');
  } finally {
    loading.value -= 1;
  }
};
const onClickCancel = () => {
  emit('cancel');
};
</script>

<template>
  <form
    class="block-spacing is-flex is-flex-direction-column"
    @submit.prevent="onSubmit"
  >
    <p>
      Are you sure you want to remove
      <template v-if="documentName?.length"> "{{ documentName }}" </template>

      <template v-else>this</template>
      ?
    </p>

    <div class="field is-grouped">
      <div class="control">
        <button class="button" type="submit" :class="{ 'is-loading': loading }">
          Remove
        </button>
      </div>

      <div class="control">
        <button
          class="button"
          type="button"
          :disabled="!!loading"
          @click="onClickCancel"
        >
          Cancel
        </button>
      </div>
    </div>
  </form>
</template>
