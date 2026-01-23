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
    type?: 'basic' | 'full-screen';
    cancelLabel?: string;
    applyLabel?: string;
    hasCancelAction?: boolean;
    loading?: boolean | number;
    // eslint-disable-next-line vue/no-unused-properties -- component don't support inheritance of classes
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

const showModel = defineModel<boolean>('show', { required: true });

const dialogContainer = useOverlayContainer();

const dialogEl = useTemplateRef<MaybeElement>('dialogEl');
</script>

<template>
  <TeleportContainer :to="dialogContainer" :container="dialogEl">
    <DialogForm
      v-if="showModel"
      ref="dialogEl"
      v-model:show="showModel"
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
