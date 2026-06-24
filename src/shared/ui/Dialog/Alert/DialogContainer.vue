<script setup lang="ts">
import MDDialog from '../MDDialog.vue';
import { useDialogState } from './useDialog';
import { MDSymbol } from '@shared/ui/Icon';

const { alertSet } = useDialogState();
</script>

<template>
  <MDDialog
    v-for="item in alertSet"
    :key="item.id"
    :headline="item.headline"
    :supporting-text="item.supportingText"
    :apply-label="item.confirmLabel ?? 'Ok'"
    :cancel-label="item.cancelLabel"
    :has-cancel-action="item.type === 'confirm'"
    @apply="item.callback(true)"
    @cancel="item.callback(false)"
  >
    <template v-if="item.symbolName" #icon>
      <MDSymbol :name="item.symbolName" />
    </template>
  </MDDialog>
</template>
