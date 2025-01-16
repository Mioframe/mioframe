<script setup lang="ts">
import type { DocumentFolder } from '@shared/lib/cfrDocument';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { ref } from 'vue';

const { parentFolder } = defineProps<{
  parentFolder: DocumentFolder;
}>();

const emit = defineEmits<{
  created: [name: string, documentFolder: DocumentFolder];
  cancel: [];
}>();

const onApply = async () => {
  if (folderName.value) {
    const newFolder = await parentFolder.createFolder(folderName.value);
    emit('created', folderName.value, newFolder);
  }
};

const folderName = ref<string>();

const onCancel = () => {
  folderName.value = undefined;
  emit('cancel');
};

// TODO: придумать индикатор процесса
</script>

<template>
  <MDDialog
    headline="Create a New Folder"
    apply-label="Create"
    cancel-label="Cancel"
    supporting-text="Enter a name for your folder"
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField v-model="folderName" label-text="Folder's name" />
  </MDDialog>
</template>
