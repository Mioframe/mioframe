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
    tertiaryLabel?: string | undefined;
    applyLabel?: string | undefined;
    hasCancelAction?: boolean | undefined;
    hasTertiaryAction?: boolean | undefined;
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
  tertiary: [];
}>();

const slots = defineSlots<{
  default(): unknown;
  icon(): unknown;
}>();

const dialogContainer = useOverlayContainer();

const dialogEl = useTemplateRef<MaybeElement>('dialogEl');

const onApplyAction = () => {
  emit('apply');
};

const onCancelAction = () => {
  emit('cancel');
};

const onTertiaryAction = () => {
  emit('tertiary');
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
      :tertiary-label="tertiaryLabel"
      :apply-label="applyLabel"
      :has-cancel-action="hasCancelAction"
      :has-tertiary-action="hasTertiaryAction"
      :loading="loading"
      :class="props.class"
      @apply="onApplyAction"
      @cancel="onCancelAction"
      @tertiary="onTertiaryAction"
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
