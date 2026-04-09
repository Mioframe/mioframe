<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { useOverlayContainer } from '../Overlay';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import DialogForm from './DialogForm.vue';
import type { MaybeElement } from '@vueuse/core';

withDefaults(
  defineProps<{
    /**
     * unique dialog title
     */
    headline: string;
    supportingText: string;
    type?: 'basic' | 'full-screen' | undefined;
    cancelLabel?: string | undefined;
    applyLabel?: string | undefined;
    hasCancelAction?: boolean | undefined;
    loading?: boolean | number | undefined;
    class?: never;
  }>(),
  {
    applyLabel: 'Apply',
  },
);

const slots = defineSlots<{
  default(): unknown;
  icon(): unknown;
}>();

const emit = defineEmits<{
  cancel: [];
  apply: [];
}>();

const dialogContainer = useOverlayContainer();

const dialogEl = useTemplateRef<MaybeElement>('dialogEl');
</script>

<template>
  <TeleportContainer :to="dialogContainer" :container="dialogEl">
    <DialogForm
      ref="dialogEl"
      :headline="headline"
      :supporting-text="supportingText"
      :type="type"
      :cancel-label="cancelLabel"
      :apply-label="applyLabel"
      :has-cancel-action="hasCancelAction"
      :loading="loading"
      @apply="emit('apply')"
      @cancel="emit('cancel')"
    >
      <template #default>
        <slot />
      </template>

      <template v-if="slots.icon" #icon>
        <slot name="icon" />
      </template>
    </DialogForm>
  </TeleportContainer>
</template>
