<script setup lang="ts">
import { MDDialog } from '@shared/ui/Dialog';
import { MDSymbol } from '@shared/ui/Icon';

const emit = defineEmits<{
  apply: [];
  cancel: [];
}>();

const show = defineModel<boolean>('show', { required: true });
</script>

<template>
  <MDDialog
    v-model:show="show"
    headline="Remove property?"
    supporting-text="Are you sure you want to delete the property and its data?"
    apply-label="Remove"
    has-cancel-action
    @apply="emit('apply')"
    @cancel="emit('cancel')"
  >
    <template #icon>
      <MDSymbol name="delete" />
    </template>
  </MDDialog>
</template>
