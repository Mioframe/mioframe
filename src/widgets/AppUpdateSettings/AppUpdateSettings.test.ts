/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import type { AppUpdateStatus } from '@entity/appUpdate';

type Candidate =
  | {
      phase: 'available' | 'ready' | 'failed';
      release: { releaseNumber: number; appVersion: string };
    }
  | {
      phase: 'activating';
      release: { releaseNumber: number; appVersion: string };
    }
  | undefined;

const status = ref<AppUpdateStatus>('not-checked');
const isCapabilityAvailable = ref(true);
const mode = ref<'automatic' | 'manual' | undefined>('manual');
const activeRelease = ref<{ releaseNumber: number } | undefined>({ releaseNumber: 1 });
const candidateRef = ref<Candidate>(undefined);
const lastSuccessfulCheckAt = ref<string | undefined>(undefined);

const checkForUpdatesMock = vi.fn();
const isChecking = ref(false);
const checkOutcome = ref<'success' | 'timeout' | 'unavailable' | undefined>();
const setModeMock = vi.fn();
const isChangingMode = ref(false);
const modeOutcome = ref<'success' | 'timeout' | 'unavailable' | undefined>();
const installOnNextLaunchMock = vi.fn();
const isInstalling = ref(false);
const installOutcome = ref<'success' | 'timeout' | 'unavailable' | undefined>();
const cancelScheduledUpdateMock = vi.fn();
const isCancelling = ref(false);
const cancelOutcome = ref<'success' | 'timeout' | 'unavailable' | undefined>();

vi.mock('@entity/appUpdate', async () => {
  const actual = await vi.importActual<typeof import('@entity/appUpdate')>('@entity/appUpdate');
  return {
    ...actual,
    useAppUpdate: () => ({
      status,
      isCapabilityAvailable,
      mode,
      activeRelease,
      candidate: candidateRef,
      lastSuccessfulCheckAt,
    }),
  };
});
vi.mock('@feature/appUpdateCheck', () => ({
  useAppUpdateCheck: () => ({
    checkForUpdates: checkForUpdatesMock,
    isChecking,
    outcome: checkOutcome,
  }),
}));
vi.mock('@feature/appUpdateModeChange', () => ({
  useAppUpdateModeChange: () => ({ setMode: setModeMock, isChangingMode, outcome: modeOutcome }),
}));
vi.mock('@feature/appUpdateInstallOnNextLaunch', () => ({
  useAppUpdateInstallOnNextLaunch: () => ({
    installOnNextLaunch: installOnNextLaunchMock,
    isInstalling,
    outcome: installOutcome,
  }),
}));
vi.mock('@feature/appUpdateCancelScheduledUpdate', () => ({
  useAppUpdateCancelScheduledUpdate: () => ({
    cancelScheduledUpdate: cancelScheduledUpdateMock,
    isCancelling,
    outcome: cancelOutcome,
  }),
}));

vi.mock('@shared/ui/Lists', () => ({
  MDList: defineComponent({
    name: 'MDListStub',
    setup(_props, { slots }) {
      return () => h('div', { role: 'list' }, slots.default?.());
    },
  }),
  MDListItem: defineComponent({
    name: 'MDListItemStub',
    props: {
      labelText: { type: String, required: true },
      supportingText: { type: String, default: undefined },
      mode: { type: String, default: 'static' },
      disabled: { type: Boolean, default: false },
    },
    emits: ['action'],
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          props.mode === 'single-action' ? 'button' : 'div',
          {
            ...attrs,
            role: attrs.role ?? 'listitem',
            disabled: props.disabled ? true : undefined,
            onClick:
              props.mode === 'single-action' && !props.disabled
                ? () => {
                    emit('action');
                  }
                : undefined,
          },
          [
            h('span', props.labelText),
            props.supportingText ? h('span', props.supportingText) : null,
            slots.trailing?.(),
          ],
        );
    },
  }),
}));

vi.mock('@shared/ui/Switch', () => ({
  MDSwitch: defineComponent({
    name: 'MDSwitchStub',
    props: {
      selected: { type: Boolean, required: true },
      disabled: { type: Boolean, default: false },
      presentation: { type: Boolean, default: false },
    },
    setup(props) {
      return () =>
        h('div', {
          'data-state': props.selected ? 'checked' : 'unchecked',
          'data-disabled': props.disabled ? 'true' : 'false',
        });
    },
  }),
}));

vi.mock('@shared/ui/material', () => ({
  MDButton: defineComponent({
    name: 'MDButtonStub',
    props: {
      label: { type: String, required: true },
      disabled: { type: Boolean, default: false },
    },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            disabled: props.disabled ? true : undefined,
            onClick: () => {
              if (!props.disabled) emit('click');
            },
          },
          props.label,
        );
    },
  }),
}));

const mountWidget = async () => {
  const { default: AppUpdateSettings } = await import('./AppUpdateSettings.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(AppUpdateSettings);
  app.mount(root);
  await nextTick();

  return {
    root,
    unmount: () => {
      app.unmount();
      root.remove();
    },
  };
};

const getButtonByText = (root: HTMLElement, text: string) =>
  Array.from(root.querySelectorAll('button')).find((button) => button.textContent.includes(text)) ??
  null;

describe('AppUpdateSettings', () => {
  afterEach(() => {
    vi.resetModules();
    status.value = 'not-checked';
    isCapabilityAvailable.value = true;
    mode.value = 'manual';
    activeRelease.value = { releaseNumber: 1 };
    candidateRef.value = undefined;
    lastSuccessfulCheckAt.value = undefined;
    isChecking.value = false;
    checkOutcome.value = undefined;
    isChangingMode.value = false;
    modeOutcome.value = undefined;
    isInstalling.value = false;
    installOutcome.value = undefined;
    isCancelling.value = false;
    cancelOutcome.value = undefined;
    checkForUpdatesMock.mockClear();
    setModeMock.mockClear();
    installOnNextLaunchMock.mockClear();
    cancelScheduledUpdateMock.mockClear();
    document.body.innerHTML = '';
  });

  it('not-checked: shows "Not checked yet", never "Up to date"', async () => {
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Not checked yet');
    expect(root.textContent).not.toContain('Up to date');
    unmount();
  });

  it('up-to-date: shows Up to date only once a successful check is recorded', async () => {
    status.value = 'up-to-date';
    lastSuccessfulCheckAt.value = '2026-07-24T00:00:00.000Z';
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Up to date');
    expect(root.textContent).toContain('Last checked:');
    unmount();
  });

  it('update-available (Manual): shows Install on next launch and calls installOnNextLaunch', async () => {
    status.value = 'update-available';
    mode.value = 'manual';
    candidateRef.value = { phase: 'available', release: { releaseNumber: 2, appVersion: '1.1.0' } };
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Update available');
    expect(root.textContent).toContain('Available version: 1.1.0');
    getButtonByText(root, 'Install on next launch')?.click();
    await nextTick();

    expect(installOnNextLaunchMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('update-available (Automatic): does not show Install on next launch', async () => {
    status.value = 'update-available';
    mode.value = 'automatic';
    candidateRef.value = { phase: 'available', release: { releaseNumber: 2, appVersion: '1.1.0' } };
    const { root, unmount } = await mountWidget();

    expect(getButtonByText(root, 'Install on next launch')).toBeNull();
    unmount();
  });

  it('update-failed (Manual): shows Retry update and calls installOnNextLaunch', async () => {
    status.value = 'failed';
    mode.value = 'manual';
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Update failed');
    expect(getButtonByText(root, 'Install on next launch')).toBeNull();
    getButtonByText(root, 'Retry update')?.click();
    await nextTick();

    expect(installOnNextLaunchMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('update-failed (Automatic): does not show Retry update', async () => {
    status.value = 'failed';
    mode.value = 'automatic';
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Update failed');
    expect(getButtonByText(root, 'Retry update')).toBeNull();
    unmount();
  });

  it('ready (Manual): shows Update ready, no Install on next launch, and a working Cancel action', async () => {
    status.value = 'ready';
    mode.value = 'manual';
    candidateRef.value = { phase: 'ready', release: { releaseNumber: 2, appVersion: '1.1.0' } };
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Update ready');
    expect(root.textContent).toContain(
      'Close all Mioframe windows and reopen Mioframe to guarantee the update.',
    );
    expect(getButtonByText(root, 'Install on next launch')).toBeNull();
    getButtonByText(root, 'Cancel scheduled update')?.click();
    await nextTick();

    expect(cancelScheduledUpdateMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('ready (Automatic): shows Update ready, no Install on next launch, no Cancel action, and stays Automatic', async () => {
    status.value = 'ready';
    mode.value = 'automatic';
    candidateRef.value = { phase: 'ready', release: { releaseNumber: 2, appVersion: '1.1.0' } };
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Update ready');
    expect(getButtonByText(root, 'Install on next launch')).toBeNull();
    expect(getButtonByText(root, 'Cancel scheduled update')).toBeNull();
    expect(root.querySelector('[data-state="checked"]')).not.toBeNull();
    unmount();
  });

  it('activating (Manual): shows the activating hint and version, never an available version, and never shows Install on next launch, Retry update, or Cancel', async () => {
    status.value = 'activating';
    mode.value = 'manual';
    candidateRef.value = {
      phase: 'activating',
      release: { releaseNumber: 2, appVersion: '1.1.0' },
    };
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Activating the update now');
    expect(root.textContent).toContain('Activating version: 1.1.0');
    expect(root.textContent).not.toContain('Available version');
    expect(getButtonByText(root, 'Install on next launch')).toBeNull();
    expect(getButtonByText(root, 'Retry update')).toBeNull();
    expect(getButtonByText(root, 'Cancel scheduled update')).toBeNull();
    unmount();
  });

  it('activating (Automatic): shows the activating hint and version, never Update ready, an update-available action, or an available version', async () => {
    status.value = 'activating';
    mode.value = 'automatic';
    candidateRef.value = {
      phase: 'activating',
      release: { releaseNumber: 2, appVersion: '1.1.0' },
    };
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Activating the update now');
    expect(root.textContent).toContain('Activating version: 1.1.0');
    expect(root.textContent).not.toContain('Available version');
    expect(root.textContent).not.toContain('Update ready');
    expect(root.textContent).not.toContain('Update available');
    unmount();
  });

  it('unavailable: disables both actions and the automatic switch, never shows Up to date', async () => {
    status.value = 'unavailable';
    isCapabilityAvailable.value = false;
    mode.value = 'manual';
    candidateRef.value = { phase: 'ready', release: { releaseNumber: 2, appVersion: '1.1.0' } };
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Updates unavailable');
    expect(root.textContent).not.toContain('Up to date');
    expect(getButtonByText(root, 'Check for updates')?.getAttribute('disabled')).toBe('');
    expect(getButtonByText(root, 'Automatic updates')?.getAttribute('disabled')).toBe('');
    expect(getButtonByText(root, 'Cancel scheduled update')).toBeNull();
    unmount();
  });

  it('keeps stable entity status while the widget presents a local checking message', async () => {
    status.value = 'up-to-date';
    isChecking.value = true;
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Up to date');
    expect(root.textContent).toContain('Checking for updates');
    expect(getButtonByText(root, 'Check for updates')?.getAttribute('disabled')).toBe('');
    unmount();
  });

  it('disables the check action while ready or activating, since discovery is pinned behind the selected release', async () => {
    status.value = 'ready';
    candidateRef.value = { phase: 'ready', release: { releaseNumber: 2, appVersion: '1.1.0' } };
    const { root, unmount } = await mountWidget();

    expect(getButtonByText(root, 'Check for updates')?.getAttribute('disabled')).toBe('');
    unmount();
  });

  it('triggers an explicit check via the distinct Check for updates action', async () => {
    const { root, unmount } = await mountWidget();

    getButtonByText(root, 'Check for updates')?.click();
    await nextTick();

    expect(checkForUpdatesMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('toggles automatic updates mode', async () => {
    mode.value = 'manual';
    const { root, unmount } = await mountWidget();

    getButtonByText(root, 'Automatic updates')?.click();
    await nextTick();

    expect(setModeMock).toHaveBeenCalledWith('automatic');
    unmount();
  });

  it('shows the check timeout without replacing the stable lifecycle status and re-enables controls', async () => {
    status.value = 'update-available';
    mode.value = 'manual';
    candidateRef.value = { phase: 'available', release: { releaseNumber: 2, appVersion: '1.1.0' } };
    checkOutcome.value = 'timeout';
    const { root, unmount } = await mountWidget();

    getButtonByText(root, 'Check for updates')?.click();
    await nextTick();

    expect(root.textContent).toContain('Update available');
    expect(root.textContent).toContain(
      'The update check timed out. It may still finish in the background.',
    );
    expect(getButtonByText(root, 'Check for updates')?.hasAttribute('disabled')).toBe(false);
    expect(getButtonByText(root, 'Install on next launch')?.hasAttribute('disabled')).toBe(false);
    unmount();
  });

  it('shows the install timeout only after the install action is latest', async () => {
    status.value = 'update-available';
    mode.value = 'manual';
    candidateRef.value = { phase: 'available', release: { releaseNumber: 2, appVersion: '1.1.0' } };
    installOutcome.value = 'timeout';
    const { root, unmount } = await mountWidget();

    getButtonByText(root, 'Install on next launch')?.click();
    await nextTick();

    expect(root.textContent).toContain(
      'Preparing the update timed out. It may still finish in the background.',
    );
    unmount();
  });

  it('shows the mode timeout only after the mode action is latest', async () => {
    mode.value = 'manual';
    modeOutcome.value = 'timeout';
    const { root, unmount } = await mountWidget();

    getButtonByText(root, 'Automatic updates')?.click();
    await nextTick();

    expect(root.textContent).toContain(
      'Changing update mode timed out. It may still finish in the background.',
    );
    unmount();
  });

  it('shows the cancellation timeout only after the cancel action is latest', async () => {
    status.value = 'ready';
    mode.value = 'manual';
    candidateRef.value = { phase: 'ready', release: { releaseNumber: 2, appVersion: '1.1.0' } };
    cancelOutcome.value = 'timeout';
    const { root, unmount } = await mountWidget();

    getButtonByText(root, 'Cancel scheduled update')?.click();
    await nextTick();

    expect(root.textContent).toContain(
      'Cancelling the scheduled update timed out. It may still finish in the background.',
    );
    unmount();
  });

  it('uses only the most recently invoked action outcome for timeout feedback', async () => {
    checkOutcome.value = 'timeout';
    modeOutcome.value = 'timeout';
    const { root, unmount } = await mountWidget();

    getButtonByText(root, 'Check for updates')?.click();
    await nextTick();
    expect(root.textContent).toContain('The update check timed out.');

    getButtonByText(root, 'Automatic updates')?.click();
    await nextTick();
    expect(root.textContent).toContain('Changing update mode timed out.');
    expect(root.textContent).not.toContain('The update check timed out.');
    unmount();
  });

  it('disables the Automatic toggle until the current mode is known', async () => {
    mode.value = undefined;
    const { root, unmount } = await mountWidget();

    expect(getButtonByText(root, 'Automatic updates')?.getAttribute('disabled')).toBe('');
    unmount();
  });

  it('shows the running version from APP_VERSION, never a raw release number', async () => {
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toMatch(/Running version: \S+/);
    unmount();
  });

  it('does not show a last-checked line when none is known', async () => {
    const { root, unmount } = await mountWidget();

    expect(root.textContent).not.toContain('Last checked:');
    unmount();
  });

  describe('connectivity presentation', () => {
    it('reacts to an offline event by showing the offline failed-check state', async () => {
      status.value = 'check-failed';
      const { root, unmount } = await mountWidget();

      expect(root.textContent).toContain('Could not check for updates');

      window.dispatchEvent(new Event('offline'));
      await nextTick();

      expect(root.textContent).toContain('Offline');
      expect(root.textContent).not.toContain('Could not check for updates');
      unmount();
    });

    it('reacts to an online event by reverting back to the could-not-check state', async () => {
      status.value = 'check-failed';
      const { root, unmount } = await mountWidget();

      window.dispatchEvent(new Event('offline'));
      await nextTick();
      expect(root.textContent).toContain('Offline');

      window.dispatchEvent(new Event('online'));
      await nextTick();

      expect(root.textContent).toContain('Could not check for updates');
      expect(root.textContent).not.toContain('Offline');
      unmount();
    });

    it('removes its online/offline listeners on unmount', async () => {
      const addSpy = vi.spyOn(window, 'addEventListener');
      const removeSpy = vi.spyOn(window, 'removeEventListener');
      const { unmount } = await mountWidget();

      const addedTypes = addSpy.mock.calls.map(([type]) => type);
      expect(addedTypes).toContain('online');
      expect(addedTypes).toContain('offline');

      unmount();

      const removedTypes = removeSpy.mock.calls.map(([type]) => type);
      expect(removedTypes).toContain('online');
      expect(removedTypes).toContain('offline');

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('does not react to a post-unmount offline event, since its listener was already removed', async () => {
      status.value = 'check-failed';
      const { unmount } = await mountWidget();
      unmount();

      expect(() => window.dispatchEvent(new Event('offline'))).not.toThrow();
    });

    it('Check for updates still uses the current connectivity state instead of resetting it', async () => {
      status.value = 'check-failed';
      const { root, unmount } = await mountWidget();

      window.dispatchEvent(new Event('offline'));
      await nextTick();
      expect(root.textContent).toContain('Offline');

      getButtonByText(root, 'Check for updates')?.click();
      await nextTick();

      expect(checkForUpdatesMock).toHaveBeenCalledTimes(1);
      expect(root.textContent).toContain('Offline');
      unmount();
    });
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
