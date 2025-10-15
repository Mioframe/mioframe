<script setup lang="ts">
import { MDButton } from '../Button';
import { toRefs, useTemplateRef, watch } from 'vue';
import { useOnEscapeKeyStacked } from '@shared/lib/useOnEscapeKeyStacked';
import { sessionUniqueId } from '@shared/lib/uniqueId';
import { useOverlay } from '../Overlay';
import { TeleportContainer } from '@shared/lib/teleportContainer';
import { onBackNavigation } from '@shared/lib/onBackNavigation';

const props = withDefaults(
  defineProps<{
    /**
     * unique dialog title
     */
    headline: string;
    supportingText: string;
    type?: 'basic' | 'full-screen';
    cancelLabel?: string;
    applyLabel: string;
    hasCancelAction?: boolean;
    loading?: boolean | number;
    class?: unknown;
  }>(),
  { cancelLabel: 'Cancel', type: 'basic' },
);

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

const slots = defineSlots<{
  default(): unknown;
  icon(): unknown;
}>();

const emit = defineEmits<{
  cancel: [];
  apply: [];
}>();

const showModel = defineModel<boolean>('show', { required: true });

const formEl = useTemplateRef('formEl');

const { dialogContainer } = useOverlay(formEl, showModel, 'dialog');

const onSubmit = () => {
  if (!loading.value) {
    emit('apply');
  }
};

const onCancel = () => {
  if (!loading.value && hasCancelAction.value) {
    emit('cancel');
    showModel.value = false;
  }
};

onBackNavigation(() => {
  const restrictNavigation = !showModel.value;
  onCancel();
  return restrictNavigation;
});

watch([showModel, showModel], ([showOverlay, showModel]) => {
  if (!showOverlay && showModel) {
    onCancel();
  }
});

useOnEscapeKeyStacked(() => {
  onCancel();
});

const dialogTitleId = sessionUniqueId('dialogTitle');
</script>

<template>
  <TeleportContainer :to="dialogContainer">
    <dialog
      v-if="showModel"
      :open="showModel"
      class="md-dialog md-dialog__scrim"
      :class="[
        {
          'md-dialog_has-icon': !!$slots.icon,
        },
        `md-dialog_${dialogType}-type`,
        stylesClass,
      ]"
      :aria-labelledby="dialogTitleId"
      aria-hidden="false"
    >
      <form
        ref="formEl"
        class="md md-dialog__container"
        @submit.prevent="onSubmit"
      >
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
          <MDButton
            v-if="hasCancelAction"
            :label="cancelLabel"
            color="text"
            @click="onCancel"
          />

          <MDButton
            :label="applyLabel"
            :loading="loading"
            color="text"
            form-action="submit"
          />
        </div>
      </form>
    </dialog>
  </TeleportContainer>
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
    max-width: min(560px, 100dvw);
    width: fit-content;

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
