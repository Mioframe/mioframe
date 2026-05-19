import { sessionUniqueId } from '@shared/lib/uniqueId';
import type { MaybeElementRef } from '@vueuse/core';
import { createGlobalState, tryOnScopeDispose, unrefElement } from '@vueuse/core';
import { isUndefined } from 'es-toolkit';
import type { Ref } from 'vue';
import { computed, reactive, ref, shallowRef, watch, watchEffect } from 'vue';

type AlertDescription = {
  type: 'alert' | 'confirm';
  headline: string;
  supportingText: string;
  id: string;
  confirmLabel?: string | undefined;
  cancelLabel?: string | undefined;
  symbolName?: string | undefined;
  callback: (result: boolean) => void;
};

/**
 * Shared object options for alert and confirm dialogs.
 */
export type DialogOptions = {
  /** Primary dialog title. */
  headline: string;
  /** Supporting body text rendered under the headline. */
  supportingText: string;
  /** Label for the primary confirmation action. */
  confirmLabel?: string | undefined;
  /** Label for the secondary cancel action. */
  cancelLabel?: string | undefined;
  /** Optional Material symbol name displayed in the dialog. */
  symbolName?: string | undefined;
};

/**
 * Returns the global queued dialog state shared by alert and confirm helpers.
 * @returns Dialog queue state and dialog open bookkeeping.
 */
export const useDialogState = createGlobalState(() => {
  const alertSet = reactive(new Set<AlertDescription>());
  const pendingDialogs: AlertDescription[] = [];
  let activeDialog: AlertDescription | undefined;

  const showNextDialog = () => {
    if (!isUndefined(activeDialog)) {
      return;
    }

    const nextDialog = pendingDialogs.shift();

    if (isUndefined(nextDialog)) {
      return;
    }

    activeDialog = nextDialog;
    alertSet.add(nextDialog);
  };

  const addDialog = async (type: 'alert' | 'confirm', options: DialogOptions) =>
    await new Promise<boolean>((resolve) => {
      const id = sessionUniqueId('dialog');
      let resolved = false;

      const callback = (result: boolean) => {
        if (resolved || activeDialog !== alertDescription) {
          return;
        }

        resolved = true;
        alertSet.delete(alertDescription);
        activeDialog = undefined;
        resolve(result);
        showNextDialog();
      };

      const alertDescription: AlertDescription = {
        type,
        id,
        headline: options.headline,
        supportingText: options.supportingText,
        confirmLabel: options.confirmLabel,
        cancelLabel: options.cancelLabel,
        callback,
        symbolName: options.symbolName,
      };

      pendingDialogs.push(alertDescription);
      showNextDialog();
    });

  const confirm = async (options: DialogOptions) => await addDialog('confirm', options);

  const alert = async (options: Omit<DialogOptions, 'cancelLabel'>) =>
    await addDialog('alert', options);

  const numberOfOpenDialogs = ref(0);

  const globalDialogContainer = shallowRef<HTMLElement | SVGElement | null | undefined>();

  return {
    alert,
    confirm,
    alertSet,
    numberOfOpenDialogs,
    globalDialogContainer,
  };
});

/**
 * Returns global alert and confirm dialog helpers.
 * @returns Global dialog actions.
 */
export const useDialog = () => {
  const { alert, confirm } = useDialogState();
  return {
    alert,
    confirm,
  };
};

/**
 * Tracks whether the current dialog instance is open for overlay coordination.
 * @param open - Reactive dialog open state.
 * @returns Shared dialog container ref for teleport coordination.
 */
export const useMonitorOpenDialog = (open: Ref<boolean>) => {
  const { numberOfOpenDialogs, globalDialogContainer } = useDialogState();

  let isCountedOpen = false;

  watch(
    open,
    (isOpen, previousOpen) => {
      if (isOpen && !isCountedOpen) {
        numberOfOpenDialogs.value += 1;
        isCountedOpen = true;
      } else if (!isOpen && !isUndefined(previousOpen) && isCountedOpen) {
        numberOfOpenDialogs.value -= 1;
        isCountedOpen = false;
      }
    },
    { immediate: true, flush: 'sync' },
  );

  tryOnScopeDispose(() => {
    if (isCountedOpen) {
      numberOfOpenDialogs.value -= 1;
      isCountedOpen = false;
    }
  });

  return {
    dialogContainer: globalDialogContainer,
  };
};

/**
 * Registers the shared teleport target used by alert dialogs.
 * @param dialogContainer - Global dialog container element reference.
 * @returns Whether any shared alert dialog is currently open.
 */
export const useDialogContainer = (dialogContainer: MaybeElementRef) => {
  const { numberOfOpenDialogs, globalDialogContainer } = useDialogState();

  watchEffect(() => {
    globalDialogContainer.value = unrefElement(dialogContainer);
  });

  return { hasOpenedDialog: computed(() => numberOfOpenDialogs.value > 0) };
};
