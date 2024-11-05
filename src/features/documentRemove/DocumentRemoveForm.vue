<script setup lang="ts">
import { ref } from 'vue';
import type { DocumentFolder } from '../../shared/lib/cfrDocument';
import type { DocumentId } from '@automerge/automerge-repo';
import { UIButton } from '@shared/ui/Button';

const props = defineProps<{
  documentFolder: DocumentFolder;
  documentId: DocumentId;
  documentName?: string;
}>();

const emit = defineEmits<{
  cancel: [];
  removed: [];
}>();

const loading = ref(0);

const onSubmit = () => {
  loading.value += 1;
  try {
    props.documentFolder.remove(props.documentId);
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

    <div class="button-grid">
      <UIButton type="submit" :loading="!!loading" danger> Remove </UIButton>

      <UIButton :disabled="!!loading" @click="onClickCancel"> Cancel </UIButton>
    </div>
  </form>
</template>
