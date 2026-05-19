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
    :tertiary-label="item.tertiaryLabel"
    :has-cancel-action="item.type === 'confirm' || item.type === 'choice'"
    :has-tertiary-action="item.type === 'choice'"
    @apply="() => item.callback(true)"
    @cancel="() => item.callback(false)"
    @tertiary="() => item.callback('tertiary')"
  >
    <template v-if="item.symbolName" #icon>
      <MDSymbol :name="item.symbolName" />
    </template>
  </MDDialog>
</template>
