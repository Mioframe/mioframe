<script setup lang="ts">
import { MDButton } from '../Button';
import { useFocusTrap } from '@vueuse/integrations/useFocusTrap';
import {
  nextTick,
  onBeforeUnmount,
  toRefs,
  toValue,
  useTemplateRef,
  watch,
} from 'vue';
import { useOnEscapeKeyStacked } from '@shared/lib/useOnEscapeKeyStacked';
import { useOverlayNavigation } from '@shared/lib/useOverlayNavigation';
import { uniqueId } from '@shared/lib/uniqueId';
import { useMonitorOpenDialog } from './Alert';

const props = withDefaults(
  defineProps<{
    headline: string;
    supportingText: string;
    type?: 'basic' | 'full-screen';
    cancelLabel?: string;
    applyLabel: string;
    hasCancelAction?: boolean;
    loading?: boolean | number;
    class?: unknown;
    /**
     * @constant
     */
    id?: string;
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
  id,
} = toRefs(props);

const slots = defineSlots<{
  default(): unknown;
  icon(): unknown;
}>();

const emit = defineEmits<{
  cancel: [];
  apply: [];
}>();

const show = defineModel<boolean>('show', { required: true });

const onSubmit = () => {
  if (!loading.value) {
    emit('apply');
  }
};

const onCancel = () => {
  if (!loading.value && hasCancelAction.value) {
    emit('cancel');
    showOverlay.value = false;
  }
};

const formEl = useTemplateRef('formEl');

const { activate: lockFocus, deactivate: unlockFocus } = useFocusTrap(formEl, {
  immediate: true,
  allowOutsideClick: true,
});

useOnEscapeKeyStacked(() => {
  onCancel();
});

onBeforeUnmount(() => {
  unlockFocus();
});

const { show: showOverlay } = useOverlayNavigation(
  toValue(id) ?? uniqueId('dialog'),
);

watch(
  [showOverlay, formEl],
  ([showOverlay, formEl]) => {
    if (showOverlay && formEl) {
      void nextTick(() => {
        lockFocus();
      });
    } else {
      unlockFocus();
    }
  },
  { flush: 'post' },
);

const showOverlayWatchHandle = watch(showOverlay, (showOverlay) => {
  showWatchHandle.pause();
  if (!showOverlay && show.value) {
    onCancel();
  }
  show.value = showOverlay;
  void nextTick(showWatchHandle.resume);
});

const showWatchHandle = watch(
  show,
  (show) => {
    showOverlayWatchHandle.pause();
    showOverlay.value = show;
    void nextTick(showOverlayWatchHandle.resume);
  },
  { immediate: true },
);

const dialogTitleId = uniqueId('dialogTitle');

const { dialogContainer } = useMonitorOpenDialog(showOverlay);
</script>

<template>
  <Teleport :to="dialogContainer">
    <dialog
      v-if="showOverlay"
      :open="showOverlay"
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
  </Teleport>
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
