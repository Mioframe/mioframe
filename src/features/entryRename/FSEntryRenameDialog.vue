<script setup lang="ts">
import { useFileSystem } from '@entity/mountedDirectories/useFileSystem';
import { PathUtils } from '@shared/lib/virtualFileSystem';
import { MDDialog } from '@shared/ui/Dialog';
import { MDTextField } from '@shared/ui/TextField';
import { computed, ref, watchEffect } from 'vue';

const { path } = defineProps<{
  path: string;
}>();

const emit = defineEmits<{
  renamed: [name: string];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });

const stateName = ref<string>();

const originalName = computed(() => path.at(-1));

watchEffect(() => {
  stateName.value = originalName.value;
});

const { move } = useFileSystem();

const loading = ref(false);

const onApply = async () => {
  if (stateName.value && !loading.value) {
    try {
      loading.value = true;
      await move(
        path,
        PathUtils.join(PathUtils.dirname(path), stateName.value),
      );
    } finally {
      loading.value = false;
    }
    emit('renamed', stateName.value);
  }
};

const onCancel = () => {
  emit('cancel');
};
</script>

<template>
  <MDDialog
    v-model:show="show"
    headline="Rename"
    supporting-text="Enter a new name"
    apply-label="Rename"
    has-cancel-action
    :loading="loading"
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField v-model="stateName" label-text="Name" />
  </MDDialog>
</template>
