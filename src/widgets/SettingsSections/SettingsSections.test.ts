/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, createApp, defineComponent, h, nextTick, ref } from 'vue';

const settings = ref<{
  diagnosticsEnabled?: boolean;
  diagnosticsConsentRequested?: boolean;
  googleDriveIntegrationEnabled?: boolean;
  hideStarterWidget?: boolean;
}>({});
let googleDriveIntegrationAvailable = true;
let sentryDiagnosticsAvailable = true;
const setDiagnosticsEnabledByUserMock = vi.fn((enabled: boolean) => {
  settings.value.diagnosticsEnabled = enabled;
  settings.value.diagnosticsConsentRequested = true;
});
const browserStorageStatus = ref<'checking' | 'ordinary' | 'persistent' | 'unsupported'>(
  'checking',
);
const enableStorageMock = vi.fn();
const isEnablingStorage = ref(false);

vi.mock('@entity/localSettings', () => ({
  useLocalSettings: () => ({
    settings,
  }),
  useDiagnosticsSettings: () => ({
    diagnosticsEnabled: computed(() => settings.value.diagnosticsEnabled === true),
    diagnosticsConsentRequested: computed(
      () => settings.value.diagnosticsConsentRequested === true,
    ),
    acceptDiagnosticsConsent: vi.fn(),
    rejectDiagnosticsConsent: vi.fn(),
    setDiagnosticsEnabledByUser: setDiagnosticsEnabledByUserMock,
  }),
}));

vi.mock('@feature/browserStoragePersistenceEnable', () => ({
  useBrowserStoragePersistenceFeedback: () => ({
    showFeedback: vi.fn(),
  }),
}));

vi.mock('@entity/browserStoragePersistence', () => ({
  useBrowserStoragePersistence: () => ({
    status: browserStorageStatus,
    isRequesting: isEnablingStorage,
    requestPersistence: enableStorageMock,
    refresh: vi.fn(),
  }),
}));

vi.mock('@shared/config', () => ({
  get GOOGLE_DRIVE_INTEGRATION_AVAILABLE() {
    return googleDriveIntegrationAvailable;
  },
  get SENTRY_DIAGNOSTICS_AVAILABLE() {
    return sentryDiagnosticsAvailable;
  },
}));

vi.mock('@shared/ui/Lists', () => ({
  MDListContainer: defineComponent({
    name: 'MDListContainerStub',
    setup(_props, { slots }) {
      return () => h('div', { role: 'list' }, slots.default?.());
    },
  }),
  MDListItem: defineComponent({
    name: 'MDListItemStub',
    props: {
      headline: {
        type: String,
        required: true,
      },
      is: {
        type: String,
        required: true,
      },
      type: {
        type: [String, Boolean],
        default: undefined,
      },
      itemRole: {
        type: String,
        default: undefined,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['click', 'keydown'],
    setup(props, { attrs, emit, slots }) {
      return () =>
        h(
          props.is,
          {
            ...attrs,
            type: typeof props.type === 'string' ? props.type : undefined,
            role: props.itemRole ?? 'listitem',
            disabled: props.is === 'button' && props.disabled ? true : undefined,
            onClick:
              props.is === 'button' && !props.disabled
                ? () => {
                    emit('click');
                  }
                : undefined,
            onKeydown:
              props.is === 'button' && !props.disabled
                ? (event: KeyboardEvent) => {
                    emit('keydown', event);
                  }
                : undefined,
          },
          [h('span', props.headline), slots.supportingText?.(), slots.trailingIcon?.()],
        );
    },
  }),
}));

vi.mock('@shared/ui/Checkbox', () => ({
  MDCheckbox: defineComponent({
    name: 'MDCheckboxStub',
    props: {
      modelValue: {
        type: Boolean,
        required: true,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
      presentation: {
        type: Boolean,
        default: false,
      },
      ariaLabel: {
        type: String,
        default: undefined,
      },
    },
    emits: ['update:modelValue'],
    setup(props, { emit }) {
      const onChange = () => {
        if (props.disabled) {
          return;
        }

        emit('update:modelValue', !props.modelValue);
      };

      return () =>
        props.presentation
          ? h('div', {
              'aria-hidden': 'true',
              'data-state': props.modelValue ? 'checked' : 'unchecked',
              'data-disabled': props.disabled ? 'true' : 'false',
            })
          : h('input', {
              type: 'checkbox',
              checked: props.modelValue,
              disabled: props.disabled,
              'aria-label': props.ariaLabel,
              onClick: (event: MouseEvent) => {
                event.stopPropagation();
                onChange();
              },
              onKeydown: (event: KeyboardEvent) => {
                if (!['Enter', ' '].includes(event.key)) {
                  return;
                }

                event.preventDefault();
                onChange();
              },
            });
    },
  }),
}));

const mountSettingsSections = async ({
  onSelectPrivacyPolicy,
  onSelectHelp,
  onSelectAboutMioframe,
}: {
  onSelectPrivacyPolicy?: (() => void) | undefined;
  onSelectHelp?: (() => void) | undefined;
  onSelectAboutMioframe?: (() => void) | undefined;
} = {}) => {
  const { SettingsSections } = await import('./index');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(SettingsSections, {
    onSelectPrivacyPolicy,
    onSelectHelp,
    onSelectAboutMioframe,
  });

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

const getCheckboxRow = (root: HTMLElement, label: string) =>
  Array.from(root.querySelectorAll<HTMLElement>('[role="checkbox"]')).find((element) =>
    element.textContent.includes(label),
  ) ?? null;

const getVisualCheckbox = (root: HTMLElement, label: string) =>
  Array.from(root.querySelectorAll<HTMLElement>('[aria-hidden="true"]')).find((element) =>
    (element.parentElement?.parentElement?.textContent ?? '').includes(label),
  ) ?? null;

const getStaticRowByText = (root: HTMLElement, text: string) =>
  Array.from(root.querySelectorAll('div')).find((element) => element.textContent.includes(text)) ??
  null;

describe('SettingsSections', () => {
  afterEach(() => {
    vi.resetModules();
    googleDriveIntegrationAvailable = true;
    sentryDiagnosticsAvailable = true;
    settings.value = {};
    browserStorageStatus.value = 'checking';
    isEnablingStorage.value = false;
    setDiagnosticsEnabledByUserMock.mockClear();
    enableStorageMock.mockClear();
    document.body.innerHTML = '';
  });

  it('renders all settings sections including Storage and opens Help entries', async () => {
    const onSelectPrivacyPolicy = vi.fn();
    const onSelectHelp = vi.fn();
    const onSelectAboutMioframe = vi.fn();
    const { root, unmount } = await mountSettingsSections({
      onSelectPrivacyPolicy,
      onSelectHelp,
      onSelectAboutMioframe,
    });

    expect(root.textContent).toContain('Storage');
    expect(root.textContent).toContain('Privacy & diagnostics');
    expect(root.textContent).toContain('Integrations');
    expect(root.textContent).toContain('Home screen');
    expect(root.textContent).toContain('Help');
    expect(root.textContent).toContain(
      'Send technical error reports to help developers fix crashes and unexpected failures.',
    );
    expect(root.textContent).toContain('Read how Mioframe handles privacy and diagnostics.');
    expect(root.textContent).toContain(
      'Read data storage, backup, restore, and troubleshooting guides.',
    );
    expect(root.textContent).toContain('About Mioframe');
    expect(root.textContent).toContain('Version and build information.');

    getButtonByText(root, 'Privacy policy')?.click();
    await nextTick();

    expect(onSelectPrivacyPolicy).toHaveBeenCalledTimes(1);

    getButtonByText(root, 'Help')?.click();
    await nextTick();

    expect(onSelectHelp).toHaveBeenCalledTimes(1);

    getButtonByText(root, 'About Mioframe')?.click();
    await nextTick();

    expect(onSelectAboutMioframe).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('toggles Google Drive between true and undefined with row click and keyboard', async () => {
    const { root, unmount } = await mountSettingsSections();
    const googleDriveRow = getCheckboxRow(root, 'Google Drive');

    expect(googleDriveRow?.getAttribute('aria-checked')).toBe('false');
    expect(getVisualCheckbox(root, 'Google Drive')).not.toBeNull();
    expect(root.querySelector('input[type="checkbox"][aria-label="Google Drive"]')).toBeNull();

    getButtonByText(root, 'Google Drive')?.click();
    await nextTick();
    expect(settings.value.googleDriveIntegrationEnabled).toBe(true);
    expect(googleDriveRow?.getAttribute('aria-checked')).toBe('true');

    getButtonByText(root, 'Google Drive')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: ' ', bubbles: true }),
    );
    await nextTick();

    expect(settings.value.googleDriveIntegrationEnabled).toBeUndefined();
    expect(googleDriveRow?.getAttribute('aria-checked')).toBe('false');

    unmount();
  });

  it('shows Google Drive as disabled and off when no client id is available', async () => {
    googleDriveIntegrationAvailable = false;
    settings.value = {
      googleDriveIntegrationEnabled: true,
    };

    const { root, unmount } = await mountSettingsSections();
    const googleDriveButton = getButtonByText(root, 'Google Drive');
    const googleDriveRow = getCheckboxRow(root, 'Google Drive');
    const googleDriveStaticRow = getStaticRowByText(root, 'Google Drive');

    expect(root.textContent).toContain('Google Drive is not available in this build.');
    expect(googleDriveButton).toBeNull();
    expect(googleDriveRow).not.toBeNull();
    expect(googleDriveRow?.tagName).toBe('DIV');
    expect(googleDriveRow?.getAttribute('aria-disabled')).toBe('true');
    expect(googleDriveRow?.getAttribute('aria-checked')).toBe('false');
    expect(googleDriveStaticRow?.tagName).toBe('DIV');

    googleDriveStaticRow?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(settings.value.googleDriveIntegrationEnabled).toBe(true);

    unmount();
  });

  it('toggles Error diagnostics between true and false with row click', async () => {
    const { root, unmount } = await mountSettingsSections();
    const errorDiagnosticsButton = getButtonByText(root, 'Error diagnostics');
    const errorDiagnosticsRow = getCheckboxRow(root, 'Error diagnostics');

    expect(root.textContent).toContain(
      'Send technical error reports to help developers fix crashes and unexpected failures.',
    );
    expect(errorDiagnosticsButton).not.toBeNull();
    expect(errorDiagnosticsRow?.getAttribute('aria-checked')).toBe('false');

    errorDiagnosticsButton?.click();
    await nextTick();

    expect(setDiagnosticsEnabledByUserMock).toHaveBeenCalledWith(true);
    expect(settings.value.diagnosticsEnabled).toBe(true);
    expect(settings.value.diagnosticsConsentRequested).toBe(true);
    expect(errorDiagnosticsRow?.getAttribute('aria-checked')).toBe('true');

    errorDiagnosticsButton?.click();
    await nextTick();

    expect(setDiagnosticsEnabledByUserMock).toHaveBeenLastCalledWith(false);
    expect(settings.value.diagnosticsEnabled).toBe(false);
    expect(settings.value.diagnosticsConsentRequested).toBe(true);
    expect(errorDiagnosticsRow?.getAttribute('aria-checked')).toBe('false');

    unmount();
  });

  it('shows Error diagnostics as disabled and off when Sentry config is unavailable', async () => {
    sentryDiagnosticsAvailable = false;
    settings.value = {
      diagnosticsEnabled: true,
    };

    const { root, unmount } = await mountSettingsSections();
    const errorDiagnosticsButton = getButtonByText(root, 'Error diagnostics');
    const errorDiagnosticsRow = getCheckboxRow(root, 'Error diagnostics');
    const errorDiagnosticsStaticRow = getStaticRowByText(root, 'Error diagnostics');

    expect(root.textContent).toContain('Diagnostics are not available in this build.');
    expect(errorDiagnosticsButton).toBeNull();
    expect(errorDiagnosticsRow).not.toBeNull();
    expect(errorDiagnosticsRow?.tagName).toBe('DIV');
    expect(errorDiagnosticsRow?.getAttribute('aria-disabled')).toBe('true');
    expect(errorDiagnosticsRow?.getAttribute('aria-checked')).toBe('false');
    expect(errorDiagnosticsStaticRow?.tagName).toBe('DIV');

    errorDiagnosticsStaticRow?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    await nextTick();

    expect(setDiagnosticsEnabledByUserMock).not.toHaveBeenCalled();
    expect(settings.value.diagnosticsEnabled).toBe(true);

    unmount();
  });

  it('toggles starter examples between hidden and default with row click and keyboard', async () => {
    const { root, unmount } = await mountSettingsSections();
    const starterExamplesRow = getCheckboxRow(root, 'Starter examples');

    expect(starterExamplesRow?.getAttribute('aria-checked')).toBe('true');
    expect(getVisualCheckbox(root, 'Starter examples')).not.toBeNull();

    getButtonByText(root, 'Starter examples')?.click();
    await nextTick();

    expect(settings.value.hideStarterWidget).toBe(true);
    expect(starterExamplesRow?.getAttribute('aria-checked')).toBe('false');

    getButtonByText(root, 'Starter examples')?.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }),
    );
    await nextTick();

    expect(settings.value.hideStarterWidget).toBeUndefined();
    expect(starterExamplesRow?.getAttribute('aria-checked')).toBe('true');

    unmount();
  });

  it('renders storage as checkbox-style item in ordinary state, unchecked and clickable', async () => {
    browserStorageStatus.value = 'ordinary';
    enableStorageMock.mockResolvedValue('not-enabled');

    const { root, unmount } = await mountSettingsSections();

    const storageRow = getCheckboxRow(root, 'More reliable browser storage');
    expect(storageRow).not.toBeNull();
    expect(storageRow?.getAttribute('aria-checked')).toBe('false');
    expect(root.textContent).toContain('Ask the browser to reduce automatic cleanup risk');

    const storageButton = getButtonByText(root, 'More reliable browser storage');
    storageButton?.click();
    await nextTick();

    expect(enableStorageMock).toHaveBeenCalledTimes(1);

    unmount();
  });

  it('renders storage as checkbox-style item in persistent state, checked and not triggering disable', async () => {
    browserStorageStatus.value = 'persistent';

    const { root, unmount } = await mountSettingsSections();

    const storageRow = getCheckboxRow(root, 'More reliable browser storage');
    expect(storageRow).not.toBeNull();
    expect(storageRow?.getAttribute('aria-checked')).toBe('true');
    expect(root.textContent).toContain('does not replace backups');
    expect(root.textContent).not.toContain('More reliable storage enabled');

    unmount();
  });

  it('renders storage as disabled checkbox in unsupported state', async () => {
    browserStorageStatus.value = 'unsupported';

    const { root, unmount } = await mountSettingsSections();

    const storageRow = getCheckboxRow(root, 'More reliable browser storage');
    expect(storageRow).not.toBeNull();
    expect(storageRow?.getAttribute('aria-disabled')).toBe('true');
    expect(root.textContent).toContain('keep backups for important data');

    const storageButton = getButtonByText(root, 'More reliable browser storage');
    storageButton?.click();
    await nextTick();

    expect(enableStorageMock).not.toHaveBeenCalled();

    unmount();
  });

  it('renders storage as disabled checkbox while checking', async () => {
    browserStorageStatus.value = 'checking';

    const { root, unmount } = await mountSettingsSections();

    const storageRow = getCheckboxRow(root, 'More reliable browser storage');
    expect(storageRow).not.toBeNull();
    expect(storageRow?.getAttribute('aria-disabled')).toBe('true');

    unmount();
  });

  it('renders storage as disabled checkbox while request is in progress', async () => {
    browserStorageStatus.value = 'ordinary';
    isEnablingStorage.value = true;

    const { root, unmount } = await mountSettingsSections();

    const storageRow = getCheckboxRow(root, 'More reliable browser storage');
    expect(storageRow).not.toBeNull();
    expect(storageRow?.getAttribute('aria-disabled')).toBe('true');

    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
