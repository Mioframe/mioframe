<script setup lang="ts">
import { nextTick, ref, toRefs, useTemplateRef } from 'vue';
import { useModalAriaHidden } from '../AriaHidden';
import { sessionUniqueId } from '@shared/lib/uniqueId';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import { useOnBackNavigationStacked } from '@shared/lib/onBackNavigation';
import { useOnEscapeKeyStacked } from '@shared/lib/useOnEscapeKeyStacked';
import { MDButton } from '../Button';
import { tryOnBeforeUnmount } from '@vueuse/core';
import { useMonitorOpenDialog } from './Alert';

const props = withDefaults(
  defineProps<{
    /**
     * unique dialog title
     */
    headline: string;
    supportingText: string;
    type?: 'basic' | 'full-screen' | undefined;
    cancelLabel?: string | undefined;
    applyLabel: string;
    hasCancelAction?: boolean | undefined;
    loading?: boolean | number | undefined;
    class?: unknown;
  }>(),
  { cancelLabel: 'Cancel', type: 'basic' },
);

const emit = defineEmits<{
  cancel: [];
  apply: [];
}>();

const slots = defineSlots<{
  default(): unknown;
  icon(): unknown;
}>();

const {
  applyLabel,
  cancelLabel,
  hasCancelAction,
  headline,
  loading,
  supportingText,
  type: dialogType,
  class: stylesClass,
} = toRefs(props);

const ariaHidden = useModalAriaHidden();

const isOpen = ref(true);

useMonitorOpenDialog(isOpen);

const dialogTitleId = sessionUniqueId('dialogTitle');

const formEl = useTemplateRef('formEl');

const { activate: lockFocus, deactivate: unlockFocus } = useFocusTrap(formEl, {
  allowOutsideClick: true,
});

void nextTick(() => {
  if (formEl.value) {
    lockFocus();
  }
});

tryOnBeforeUnmount(() => {
  isOpen.value = false;
  unlockFocus();
});

const onSubmit = () => {
  if (!loading.value) {
    emit('apply');
  }
};

const onCancel = () => {
  if (!loading.value && hasCancelAction.value) {
    emit('cancel');
  }
};

useOnBackNavigationStacked(() => {
  onCancel();
  return false;
});

useOnEscapeKeyStacked(() => {
  onCancel();
});
</script>

<template>
  <dialog
    open
    class="md-dialog md-dialog__scrim"
    :class="[
      {
        'md-dialog_has-icon': !!$slots.icon,
      },
      `md-dialog_${dialogType}-type`,
      stylesClass,
    ]"
    :aria-labelledby="dialogTitleId"
    :aria-hidden="ariaHidden"
  >
    <form ref="formEl" class="md md-dialog__container" @submit.prevent="onSubmit">
      <div v-if="!!slots.icon" class="md-dialog__icon">
        <slot name="icon" />
      </div>

      <div :id="dialogTitleId" class="md-dialog__headline">
        {{ headline }}
      </div>

      <div class="md-dialog__supporting-text">
        {{ supportingText }}
      </div>

      <div v-if="!!slots.default" class="md-dialog__body">
        <slot />
      </div>

      <div class="md-dialog__actions">
        <MDButton v-if="hasCancelAction" :label="cancelLabel" color="text" @click="onCancel" />

        <MDButton :label="applyLabel" :loading="loading" color="text" form-action="submit" />
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.md-dialog {
  &__scrim {
    position: fixed;
    z-index: 1;
    top: 0;
    left: 0;
    width: 100dvw;
    height: 100dvh;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
    border: 0;
    background-color: rgb(from var(--md-sys-color-scrim) r g b / 10%);
  }

  &__container {
    box-sizing: border-box;
    padding: 24px;
    border-radius: 28px;
    height: fit-content;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    min-width: 280px;
    width: 100%;
    max-width: min(560px, 100dvw);

    --md-container-color: var(--md-sys-color-surface-container-high);
    box-shadow: var(--md-sys-elevation-level3);
  }

  &__icon {
    width: 24px;
    height: 24px;
    display: flex;
    justify-content: center;
    align-items: center;
    --md-content-color: : var(--md-sys-color-secondary);
    margin: 0 auto;
  }

  &__headline {
    text-align: start;

    font-family: var(--md-sys-typescale-headline-small-font);
    line-height: var(--md-sys-typescale-headline-small-line-height);
    font-size: var(--md-sys-typescale-headline-small-size);
    font-weight: var(--md-sys-typescale-headline-small-weight);
    letter-spacing: var(--md-sys-typescale-headline-small-tracking);

    --md-content-color: var(--md-sys-color-on-surface);

    .md-dialog_has-icon & {
      text-align: center;
      margin-top: 16px;
    }
  }

  &__supporting-text {
    margin-top: 16px;

    font-family: var(--md-sys-typescale-body-medium-font);
    line-height: var(--md-sys-typescale-body-medium-line-height);
    font-size: var(--md-sys-typescale-body-medium-size);
    font-weight: var(--md-sys-typescale-body-medium-weight);
    letter-spacing: var(--md-sys-typescale-body-medium-tracking);

    color: var(--md-sys-color-on-surface-variant);
  }

  &__body {
    margin-top: 12px;
    padding-top: 12px;
    gap: 16px;
    display: flex;
    flex-direction: column;
    overflow-y: auto;
    padding-bottom: 4px;
  }

  &__actions {
    margin-top: 20px;
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }
}
</style>
