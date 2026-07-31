/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import type { AppUpdateStatus } from '@entity/appUpdate';

const status = ref<AppUpdateStatus>('not-checked');
const mode = ref<'automatic' | 'manual'>('manual');
const activeRelease = ref<{ releaseId: string; releaseSequence: number } | undefined>({
  releaseId: 'release-a',
  releaseSequence: 1,
});
const latestReleaseRef = ref<
  { releaseId: string; releaseSequence: number; appVersion: string } | undefined
>(undefined);
const scheduledReleaseRef = ref<
  { releaseId: string; releaseSequence: number; appVersion: string } | undefined
>(undefined);
const activatingReleaseRef = ref<
  { releaseId: string; releaseSequence: number; appVersion: string } | undefined
>(undefined);
const lastSuccessfulCheckAt = ref<string | undefined>(undefined);

const checkForUpdatesMock = vi.fn();
const isChecking = ref(false);
const setModeMock = vi.fn();
const isChangingMode = ref(false);
const installOnNextLaunchMock = vi.fn();
const isInstalling = ref(false);
const cancelScheduledUpdateMock = vi.fn();
const isCancelling = ref(false);

vi.mock('@entity/appUpdate', async () => {
  const actual = await vi.importActual<typeof import('@entity/appUpdate')>('@entity/appUpdate');
  return {
    ...actual,
    useAppUpdate: () => ({
      status,
      mode,
      activeRelease,
      latestRelease: latestReleaseRef,
      scheduledRelease: scheduledReleaseRef,
      activatingRelease: activatingReleaseRef,
      lastSuccessfulCheckAt,
    }),
  };
});
vi.mock('@feature/appUpdateCheck', () => ({
  useAppUpdateCheck: () => ({ checkForUpdates: checkForUpdatesMock, isChecking }),
}));
vi.mock('@feature/appUpdateModeChange', () => ({
  useAppUpdateModeChange: () => ({ setMode: setModeMock, isChangingMode }),
}));
vi.mock('@feature/appUpdateInstallOnNextLaunch', () => ({
  useAppUpdateInstallOnNextLaunch: () => ({
    installOnNextLaunch: installOnNextLaunchMock,
    isInstalling,
  }),
}));
vi.mock('@feature/appUpdateCancelScheduledUpdate', () => ({
  useAppUpdateCancelScheduledUpdate: () => ({
    cancelScheduledUpdate: cancelScheduledUpdateMock,
    isCancelling,
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

vi.mock('@shared/ui/Button', () => ({
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
    mode.value = 'manual';
    activeRelease.value = { releaseId: 'release-a', releaseSequence: 1 };
    latestReleaseRef.value = undefined;
    scheduledReleaseRef.value = undefined;
    activatingReleaseRef.value = undefined;
    lastSuccessfulCheckAt.value = undefined;
    isChecking.value = false;
    isChangingMode.value = false;
    isInstalling.value = false;
    isCancelling.value = false;
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
    latestReleaseRef.value = { releaseId: 'release-b', releaseSequence: 2, appVersion: '1.1.0' };
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
    latestReleaseRef.value = { releaseId: 'release-b', releaseSequence: 2, appVersion: '1.1.0' };
    const { root, unmount } = await mountWidget();

    expect(getButtonByText(root, 'Install on next launch')).toBeNull();
    unmount();
  });

  it('update-failed (Manual): shows Retry update and calls installOnNextLaunch', async () => {
    status.value = 'rolled-back';
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
    status.value = 'rolled-back';
    mode.value = 'automatic';
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Update failed');
    expect(getButtonByText(root, 'Retry update')).toBeNull();
    unmount();
  });

  it('ready (Manual): shows Update ready, no Install on next launch, and a working Cancel action', async () => {
    status.value = 'ready';
    mode.value = 'manual';
    scheduledReleaseRef.value = { releaseId: 'release-b', releaseSequence: 2, appVersion: '1.1.0' };
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
    scheduledReleaseRef.value = { releaseId: 'release-b', releaseSequence: 2, appVersion: '1.1.0' };
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
    activatingReleaseRef.value = {
      releaseId: 'release-b',
      releaseSequence: 2,
      appVersion: '1.1.0',
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
    activatingReleaseRef.value = {
      releaseId: 'release-b',
      releaseSequence: 2,
      appVersion: '1.1.0',
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
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Updates unavailable');
    expect(root.textContent).not.toContain('Up to date');
    expect(getButtonByText(root, 'Check for updates')?.getAttribute('disabled')).toBe('');
    expect(getButtonByText(root, 'Automatic updates')?.getAttribute('disabled')).toBe('');
    unmount();
  });

  it('checking: disables the check action while an explicit check is in flight', async () => {
    isChecking.value = true;
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toContain('Checking for updates');
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

  it('shows the running version from APP_VERSION, never a release identity', async () => {
    const { root, unmount } = await mountWidget();

    expect(root.textContent).toMatch(/Running version: \S+/);
    expect(root.textContent).not.toContain('release-a');
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
