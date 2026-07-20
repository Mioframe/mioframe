/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import { dayjs } from '@shared/lib/dayjs';

const clipboardWriteTextMock = vi.fn<Navigator['clipboard']['writeText']>();
const addSnackbarMock = vi.fn();
const diagnosticsEnabled = ref(true);
let appBuildId: string | undefined = 'sha-1234567';
let sentryDiagnosticsAvailable = true;
const appBuildDate = '2026-05-15T12:34:56.000Z';
const formattedAppBuildDate = dayjs(appBuildDate).format('lll');
type NavigatorWithUserAgentData = Navigator & { userAgentData?: unknown };
const navigatorWithUserAgentData: NavigatorWithUserAgentData = navigator;
const navigatorPrototypeWithUserAgentData: NavigatorWithUserAgentData = Navigator.prototype;

vi.mock('@entity/localSettings', () => ({
  useDiagnosticsSettings: () => ({
    diagnosticsEnabled: computed(() => diagnosticsEnabled.value),
    diagnosticsConsentRequested: computed(() => true),
    setDiagnosticsEnabledByUser: vi.fn(),
  }),
}));

vi.mock('@shared/config', () => ({
  APP_NAME: 'Mioframe',
  APP_VERSION: '0.0.1',
  APP_BUILD_DATE: appBuildDate,
  get APP_BUILD_ID() {
    return appBuildId;
  },
  GOOGLE_DRIVE_INTEGRATION_AVAILABLE: true,
  get SENTRY_DIAGNOSTICS_AVAILABLE() {
    return sentryDiagnosticsAvailable;
  },
}));

vi.mock('@shared/ui/Layout', () => ({
  MDPane: defineComponent({
    name: 'MDPaneStub',
    setup(_props, { slots }) {
      return () => h('section', [slots.topBar?.(), slots.default?.()]);
    },
  }),
}));

vi.mock('@shared/ui/AppBar', () => ({
  MDAppBar: defineComponent({
    name: 'MDAppBarStub',
    props: {
      headline: {
        type: String,
        required: true,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('header', [
          h('div', { class: 'leading-button-slot' }, slots.leadingButton?.()),
          h('h1', props.headline),
          h('div', { class: 'trailing-elements-slot' }, slots.trailingElements?.()),
        ]);
    },
  }),
}));

vi.mock('@shared/ui/material', () => ({
  MDButton: defineComponent({
    name: 'MDButtonStub',
    props: {
      label: {
        type: String,
        required: true,
      },
    },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            onClick: () => {
              emit('click');
            },
          },
          props.label,
        );
    },
  }),
}));

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: addSnackbarMock,
  }),
}));

const mountAboutMioframePane = async ({
  withNavigationButton = false,
}: {
  withNavigationButton?: boolean;
} = {}) => {
  const { default: AboutMioframePane } = await import('./AboutMioframePane.vue');

  return mount(AboutMioframePane, {
    slots: withNavigationButton
      ? { navigationButton: () => h('button', { type: 'button' }, 'Back') }
      : {},
  });
};

const clickCopyDiagnostics = async (
  wrapper: Awaited<ReturnType<typeof mountAboutMioframePane>>,
) => {
  await wrapper.get('button[type="button"]').trigger('click');
};

const getLastCopiedText = () => clipboardWriteTextMock.mock.calls[0]?.[0] ?? '';

Object.defineProperty(navigator, 'clipboard', {
  configurable: true,
  value: {
    writeText: clipboardWriteTextMock,
  },
});

Object.defineProperty(navigator, 'userAgent', {
  configurable: true,
  value: 'unit-test-agent/1.0',
});

Object.defineProperty(navigator, 'userAgentData', {
  configurable: true,
  value: {
    platform: 'UnitTestOS',
  },
});

describe('AboutMioframePane', () => {
  afterEach(() => {
    appBuildId = 'sha-1234567';
    sentryDiagnosticsAvailable = true;
    diagnosticsEnabled.value = true;
    addSnackbarMock.mockReset();
    clipboardWriteTextMock.mockReset();
    delete navigatorPrototypeWithUserAgentData.userAgentData;
    Object.defineProperty(navigator, 'userAgentData', {
      configurable: true,
      value: {
        platform: 'UnitTestOS',
      },
    });
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: clipboardWriteTextMock,
      },
    });
  });

  it('renders About Mioframe details and the leading navigation slot', async () => {
    const wrapper = await mountAboutMioframePane({ withNavigationButton: true });

    expect(wrapper.text()).toContain('About Mioframe');
    expect(wrapper.text()).toContain('Mioframe');
    expect(wrapper.text()).toContain('Version: 0.0.1');
    expect(wrapper.text()).toContain(`Build date: ${formattedAppBuildDate}`);
    expect(wrapper.text()).not.toContain(`Build date: ${appBuildDate}`);
    expect(wrapper.text()).toContain('Build: sha-1234567');
    expect(wrapper.text()).not.toContain('Beaver');
    expect(wrapper.find('.leading-button-slot').text()).toBe('Back');
  });

  it('does not render the build id row when it is absent', async () => {
    appBuildId = undefined;
    const wrapper = await mountAboutMioframePane();

    expect(wrapper.text()).not.toContain('Build:');
  });

  it('copies safe diagnostics metadata and shows a success snackbar', async () => {
    const wrapper = await mountAboutMioframePane();

    await clickCopyDiagnostics(wrapper);

    expect(clipboardWriteTextMock).toHaveBeenCalledTimes(1);
    const copiedText = getLastCopiedText();
    expect(copiedText).toContain('App: Mioframe');
    expect(copiedText).toContain('Version: 0.0.1');
    expect(copiedText).toContain(`Build date: ${appBuildDate}`);
    expect(copiedText).not.toContain(`Build date: ${formattedAppBuildDate}`);
    expect(copiedText).toContain('Build id: sha-1234567');
    expect(copiedText).toContain('Diagnostics available: yes');
    expect(copiedText).toContain('Diagnostics enabled: yes');
    expect(copiedText).toContain('Google Drive available: yes');
    expect(copiedText).toContain('Browser: unit-test-agent/1.0');
    expect(copiedText).toContain('Platform: UnitTestOS');
    expect(copiedText).not.toContain('path');
    expect(copiedText).not.toContain('document id');
    expect(copiedText).not.toContain('file id');
    expect(copiedText).not.toContain('token');
    expect(copiedText).not.toContain('document name');
    expect(copiedText).not.toContain('folder name');
    expect(copiedText).not.toContain('content');
    expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Diagnostics copied' });
  });

  it('copies diagnostics with disabled status when diagnostics are unavailable in this build', async () => {
    sentryDiagnosticsAvailable = false;
    diagnosticsEnabled.value = true;
    const wrapper = await mountAboutMioframePane();

    await clickCopyDiagnostics(wrapper);

    const copiedText = getLastCopiedText();
    expect(copiedText).toContain('Diagnostics available: no');
    expect(copiedText).toContain('Diagnostics enabled: no');
  });

  it('includes platform in copied diagnostics when userAgentData is available via the prototype', async () => {
    Object.defineProperty(Navigator.prototype, 'userAgentData', {
      configurable: true,
      value: {
        platform: 'PrototypeOS',
      },
    });
    delete navigatorWithUserAgentData.userAgentData;

    const wrapper = await mountAboutMioframePane();

    await clickCopyDiagnostics(wrapper);

    expect(getLastCopiedText()).toContain('Platform: PrototypeOS');

    delete navigatorPrototypeWithUserAgentData.userAgentData;
    Object.defineProperty(navigator, 'userAgentData', {
      configurable: true,
      value: {
        platform: 'UnitTestOS',
      },
    });
  });

  it('shows a failure snackbar when clipboard write fails', async () => {
    clipboardWriteTextMock.mockRejectedValueOnce(new Error('copy failed'));
    const wrapper = await mountAboutMioframePane();

    await clickCopyDiagnostics(wrapper);

    expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Could not copy diagnostics' });
  });

  it('shows the clipboard-unavailable snackbar and never calls writeText when navigator.clipboard is absent', async () => {
    type NavigatorWithClipboard = Omit<Navigator, 'clipboard'> & { clipboard?: unknown };
    const navigatorWithClipboard: NavigatorWithClipboard = navigator;
    const navigatorPrototypeWithClipboard: NavigatorWithClipboard = Navigator.prototype;
    const originalPrototypeDescriptor = Object.getOwnPropertyDescriptor(
      Navigator.prototype,
      'clipboard',
    );
    // oxlint-disable-next-line no-restricted-syntax -- intentionally removing the own and prototype clipboard accessors only within this isolated test, to simulate a browser without the Clipboard API.
    delete navigatorWithClipboard.clipboard;
    // oxlint-disable-next-line no-restricted-syntax -- see above.
    delete navigatorPrototypeWithClipboard.clipboard;

    const wrapper = await mountAboutMioframePane();

    await clickCopyDiagnostics(wrapper);

    expect(clipboardWriteTextMock).not.toHaveBeenCalled();
    expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Clipboard is not available' });

    if (originalPrototypeDescriptor) {
      Object.defineProperty(Navigator.prototype, 'clipboard', originalPrototypeDescriptor);
    }
  });

  it('shows diagnostics as disabled when diagnostics are available but turned off by the user', async () => {
    sentryDiagnosticsAvailable = true;
    diagnosticsEnabled.value = false;
    const wrapper = await mountAboutMioframePane();

    await clickCopyDiagnostics(wrapper);

    const copiedText = getLastCopiedText();
    expect(copiedText).toContain('Diagnostics available: yes');
    expect(copiedText).toContain('Diagnostics enabled: no');
  });

  it.each([
    ['userAgentData is absent', undefined],
    ['userAgentData is not an object', 'not-an-object'],
    ['platform is an empty string', { platform: '' }],
    ['platform is not a string', { platform: 42 }],
  ])('does not include a platform line in copied diagnostics when %s', async (_name, value) => {
    Object.defineProperty(navigator, 'userAgentData', {
      configurable: true,
      value,
    });
    const wrapper = await mountAboutMioframePane();

    await clickCopyDiagnostics(wrapper);

    expect(getLastCopiedText()).not.toContain('Platform:');
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
