/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import type { AppUpdateStatus } from '@entity/appUpdate';

const status = ref<AppUpdateStatus>('not-checked');
const mode = ref<'automatic' | 'manual'>('manual');
const checkForUpdatesMock = vi.fn();
const isChecking = ref(false);
const setModeMock = vi.fn();
const isChangingMode = ref(false);
const installOnNextLaunchMock = vi.fn();
const isInstalling = ref(false);
const cancelScheduledUpdateMock = vi.fn();
const isCancelling = ref(false);

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({ status, mode }),
}));
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

vi.mock('@shared/ui/ProgressIndicators', () => ({
  MDCircularProgressIndicator: defineComponent({
    name: 'MDCircularProgressIndicatorStub',
    props: { size: { type: Number, default: 40 } },
    template: '<div data-testid="loading-indicator" />',
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

const mountSection = async () => {
  const { default: AppUpdateSettingsSection } = await import('./AppUpdateSettingsSection.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(AppUpdateSettingsSection);
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

describe('AppUpdateSettingsSection', () => {
  afterEach(() => {
    vi.resetModules();
    status.value = 'not-checked';
    mode.value = 'manual';
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

  it('not-checked: shows the check action and triggers it', async () => {
    const { root, unmount } = await mountSection();

    expect(root.textContent).toContain("You haven't checked for updates yet.");
    getButtonByText(root, 'Check for updates')?.click();
    await nextTick();

    expect(checkForUpdatesMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('up-to-date: shows the up-to-date message with a check action', async () => {
    status.value = 'up-to-date';
    const { root, unmount } = await mountSection();

    expect(root.textContent).toContain("You're on the latest release.");
    expect(getButtonByText(root, 'Check for updates')).not.toBeNull();
    unmount();
  });

  it('update-available (manual): shows install-on-next-launch action', async () => {
    status.value = 'update-available';
    mode.value = 'manual';
    const { root, unmount } = await mountSection();

    expect(root.textContent).toContain('A newer release is available.');
    getButtonByText(root, 'Install on next launch')?.click();
    await nextTick();

    expect(installOnNextLaunchMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('update-available (automatic): is informational only, no action', async () => {
    status.value = 'update-available';
    mode.value = 'automatic';
    const { root, unmount } = await mountSection();

    expect(root.textContent).toContain('A newer release is being downloaded automatically.');
    const button = getButtonByText(root, 'Update available');
    expect(button?.getAttribute('disabled')).toBe('');
    unmount();
  });

  it('rolled-back (manual): shows the failure message with a retry install action', async () => {
    status.value = 'rolled-back';
    mode.value = 'manual';
    const { root, unmount } = await mountSection();

    expect(root.textContent).toContain(
      'The last update attempt failed to start and was rolled back. You can try again.',
    );
    getButtonByText(root, 'Install on next launch')?.click();
    await nextTick();

    expect(installOnNextLaunchMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('rolled-back (automatic): is informational only, no action', async () => {
    status.value = 'rolled-back';
    mode.value = 'automatic';
    const { root, unmount } = await mountSection();

    expect(root.textContent).toContain(
      'The last update attempt failed to start and was rolled back.',
    );
    const button = getButtonByText(root, 'Update failed');
    expect(button?.getAttribute('disabled')).toBe('');
    unmount();
  });

  it('downloading: shows a loading indicator and disables the action while checking', async () => {
    isChecking.value = true;
    const { root, unmount } = await mountSection();

    expect(root.textContent).toContain('Downloading update');
    expect(root.querySelector('[data-testid="loading-indicator"]')).not.toBeNull();
    unmount();
  });

  it('ready: shows the exact required wording and a cancel action', async () => {
    status.value = 'ready';
    const { root, unmount } = await mountSection();

    expect(root.textContent).toContain('Update ready');
    expect(root.textContent).toContain(
      'Close all Mioframe windows to finish updating. Your current session will not be interrupted.',
    );
    getButtonByText(root, 'Cancel scheduled update')?.click();
    await nextTick();

    expect(cancelScheduledUpdateMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('install-failed: shows the failure message with a retry check action', async () => {
    status.value = 'install-failed';
    const { root, unmount } = await mountSection();

    expect(root.textContent).toContain('Installation failed. You can try again.');
    getButtonByText(root, 'Check for updates')?.click();
    await nextTick();

    expect(checkForUpdatesMock).toHaveBeenCalledTimes(1);
    unmount();
  });

  it('check-failed: shows the failure message with a retry check action', async () => {
    status.value = 'check-failed';
    const { root, unmount } = await mountSection();

    expect(root.textContent).toContain('Update check failed. Try again later.');
    expect(getButtonByText(root, 'Check for updates')).not.toBeNull();
    unmount();
  });

  it('unavailable: shows the capability-unavailable message and disables the automatic switch', async () => {
    status.value = 'unavailable';
    const { root, unmount } = await mountSection();

    expect(root.textContent).toContain("Updates aren't available in this browser or build.");
    const automaticSwitchButton = getButtonByText(root, 'Automatic updates');
    expect(automaticSwitchButton?.getAttribute('disabled')).toBe('');
    unmount();
  });

  it('toggles automatic updates mode', async () => {
    mode.value = 'manual';
    const { root, unmount } = await mountSection();

    getButtonByText(root, 'Automatic updates')?.click();
    await nextTick();

    expect(setModeMock).toHaveBeenCalledWith('automatic');
    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
