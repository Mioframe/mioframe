<script setup lang="ts">
import { useFileSystem } from '@entity/mountedDirectories';
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

const stateName = ref<string>();

const stateNameModel = computed<string | undefined>({
  get: () => stateName.value,
  set: (name) => {
    stateName.value = name;
  },
});

const originalName = computed(() => PathUtils.basename(path));

watchEffect(() => {
  stateName.value = originalName.value;
});

const { move } = useFileSystem();

const loading = ref(false);

const onApply = async () => {
  if (stateName.value && !loading.value) {
    try {
      loading.value = true;
      await move(path, PathUtils.join(PathUtils.dirname(path), stateName.value));
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
    headline="Rename"
    supporting-text="Enter a new name"
    apply-label="Rename"
    has-cancel-action
    :loading="loading"
    @apply="onApply"
    @cancel="onCancel"
  >
    <MDTextField v-model="stateNameModel" label-text="Name" />
  </MDDialog>
</template>
