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
    :show="alertSet.has(item)"
    :headline="item.headline"
    :supporting-text="item.supportingText"
    :apply-label="item.confirmLabel ?? 'Ok'"
    :has-cancel-action="item.type === 'confirm'"
    class="alert-container__dialog"
    @apply="item.callback(true)"
    @cancel="item.callback(false)"
  >
    <template v-if="item.symbolName" #icon>
      <MDSymbol :name="item.symbolName" />
    </template>
  </MDDialog>
</template>
