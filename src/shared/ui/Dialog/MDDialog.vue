<script setup lang="ts">
import { useTemplateRef } from 'vue';
import { useOverlayContainer } from '../Overlay';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import DialogForm from './DialogForm.vue';
import type { MaybeElement } from '@vueuse/core';

const props = withDefaults(
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

const emit = defineEmits<{
  cancel: [];
  apply: [];
}>();

const slots = defineSlots<{
  default(): unknown;
  icon(): unknown;
  actions(): unknown;
}>();

const dialogContainer = useOverlayContainer();

const dialogEl = useTemplateRef<MaybeElement>('dialogEl');

const onApplyAction = () => {
  emit('apply');
};

const onCancelAction = () => {
  emit('cancel');
};
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
      :class="props.class"
      @apply="onApplyAction"
      @cancel="onCancelAction"
    >
      <template #default>
        <slot />
      </template>

      <template v-if="slots.icon" #icon>
        <slot name="icon" />
      </template>

      <template v-if="slots.actions" #actions>
        <slot name="actions" />
      </template>
    </DialogForm>
  </TeleportContainer>
</template>
