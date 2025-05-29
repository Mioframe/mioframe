<script setup lang="ts">
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';
import MDDialog from '../MDDialog.vue';
import { useDialogState } from './useDialog';
import { MDSymbol } from '@shared/ui/Icon';

const targetTeleport = useClosestParentFrame();

const { alertSet } = useDialogState();
</script>

<template>
  <Teleport defer :to="targetTeleport">
    <div class="dialog-container">
      <MDDialog
        v-for="item in alertSet"
        :key="item.id"
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
    </div>
  </Teleport>
</template>

<style lang="css" scoped>
.dialog-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  pointer-events: none;
  background: transparent;

  &__dialog {
    pointer-events: auto;
  }
}
</style>
