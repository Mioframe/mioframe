<script setup lang="ts">
import MDSnackbar from './MDSnackbar.vue';
import { useSnackbar } from './useSnackbar';
import { useClosestParentFrame } from '@shared/lib/useClosestParentFrame';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import { useTemplateRef } from 'vue';

const { currentSnackbar, closeSnackbar } = useSnackbar();

const onClickClose = () => {
  closeSnackbar();
};

const targetTeleport = useClosestParentFrame();

const snackbarContainer = useTemplateRef('snackbarContainer');
</script>

<template>
  <TeleportContainer :to="targetTeleport" :container="snackbarContainer">
    <div ref="snackbarContainer" class="snackbar-container">
      <MDSnackbar
        v-if="currentSnackbar"
        :key="currentSnackbar.id"
        class="snackbar-container__snackbar"
        :text="currentSnackbar.text"
        :action-label="currentSnackbar.actionLabel"
        @click-action="currentSnackbar.callback"
        @click-close="onClickClose"
      />
    </div>
  </TeleportContainer>
</template>

<style scoped>
.snackbar-container {
  position: fixed;
  z-index: 2;
  left: 16px;
  right: 16px;
  bottom: 16px;
  pointer-events: none;
  display: flex;
  justify-content: center;
  align-items: center;

  &__snackbar {
    pointer-events: all;
  }
}
</style>
