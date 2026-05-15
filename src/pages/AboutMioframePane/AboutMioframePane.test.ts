/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, expect, it, vi } from 'vitest';
import { computed, createApp, defineComponent, h, nextTick, ref } from 'vue';

const clipboardWriteTextMock = vi.fn<Navigator['clipboard']['writeText']>();
const addSnackbarMock = vi.fn();
const diagnosticsEnabled = ref(true);
let appBuildId: string | undefined = 'sha-1234567';
let sentryDiagnosticsAvailable = true;
const appBuildDate = '2026-05-15T12:34:56.000Z';
const formattedAppBuildDate = new Date(appBuildDate).toLocaleString(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});
type NavigatorWithUserAgentData = Navigator & { userAgentData?: unknown };
const navigatorWithUserAgentData: NavigatorWithUserAgentData = navigator;
const navigatorPrototypeWithUserAgentData: NavigatorWithUserAgentData = Navigator.prototype;

vi.mock('@entity/localSettings', () => ({
  useDiagnosticsSettings: () => ({
    diagnosticsEnabled: computed(() => diagnosticsEnabled.value),
    diagnosticsConsentRequested: computed(() => true),
    acceptDiagnosticsConsent: vi.fn(),
    rejectDiagnosticsConsent: vi.fn(),
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
      return () => h('section', slots.default?.());
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
          h('div', { 'data-slot': 'leading-button' }, slots.leadingButton?.()),
          h('h1', props.headline),
          h('div', { 'data-slot': 'trailing-elements' }, slots.trailingElements?.()),
        ]);
    },
  }),
}));

vi.mock('@shared/ui/Button', () => ({
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
  const root = document.createElement('div');
  document.body.appendChild(root);

  const app = createApp(
    withNavigationButton
      ? defineComponent({
          setup() {
            return () =>
              h(AboutMioframePane, null, {
                navigationButton: () => h('button', { type: 'button' }, 'Back'),
              });
          },
        })
      : AboutMioframePane,
  );

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

it('renders About Mioframe details and the leading navigation slot', async () => {
  const { root, unmount } = await mountAboutMioframePane({ withNavigationButton: true });

  expect(root.textContent).toContain('About Mioframe');
  expect(root.textContent).toContain('Mioframe');
  expect(root.textContent).toContain('Version: 0.0.1');
  expect(root.textContent).toContain(`Build date: ${formattedAppBuildDate}`);
  expect(root.textContent).not.toContain(`Build date: ${appBuildDate}`);
  expect(root.textContent).toContain('Build: sha-1234567');
  expect(root.textContent).not.toContain('Beaver');
  expect(root.querySelector('[data-slot="leading-button"]')?.textContent).toContain('Back');

  unmount();
});

it('does not render the build id row when it is absent', async () => {
  appBuildId = undefined;
  const { root, unmount } = await mountAboutMioframePane();

  expect(root.textContent).not.toContain('Build:');

  unmount();
});

it('copies safe diagnostics metadata and shows a success snackbar', async () => {
  const { root, unmount } = await mountAboutMioframePane();

  root.querySelector('button')?.click();
  await nextTick();

  expect(clipboardWriteTextMock).toHaveBeenCalledTimes(1);
  const copiedText = clipboardWriteTextMock.mock.calls[0]?.[0] ?? '';
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

  unmount();
});

it('copies diagnostics with disabled status when diagnostics are unavailable in this build', async () => {
  sentryDiagnosticsAvailable = false;
  diagnosticsEnabled.value = true;
  const { root, unmount } = await mountAboutMioframePane();

  root.querySelector('button')?.click();
  await nextTick();

  const copiedText = clipboardWriteTextMock.mock.calls[0]?.[0] ?? '';
  expect(copiedText).toContain('Diagnostics available: no');
  expect(copiedText).toContain('Diagnostics enabled: no');

  unmount();
});

it('includes platform in copied diagnostics when userAgentData is available via the prototype', async () => {
  Object.defineProperty(Navigator.prototype, 'userAgentData', {
    configurable: true,
    value: {
      platform: 'PrototypeOS',
    },
  });
  delete navigatorWithUserAgentData.userAgentData;

  const { root, unmount } = await mountAboutMioframePane();

  root.querySelector('button')?.click();
  await nextTick();

  const copiedText = clipboardWriteTextMock.mock.calls[0]?.[0] ?? '';
  expect(copiedText).toContain('Platform: PrototypeOS');

  unmount();

  delete navigatorPrototypeWithUserAgentData.userAgentData;
  Object.defineProperty(navigatorWithUserAgentData, 'userAgentData', {
    configurable: true,
    value: {
      platform: 'UnitTestOS',
    },
  });
});

it('shows a failure snackbar when clipboard write fails', async () => {
  clipboardWriteTextMock.mockRejectedValueOnce(new Error('copy failed'));
  const { root, unmount } = await mountAboutMioframePane();

  root.querySelector('button')?.click();
  await nextTick();

  expect(addSnackbarMock).toHaveBeenCalledWith({ text: 'Could not copy diagnostics' });

  unmount();
});

afterEach(() => {
  appBuildId = 'sha-1234567';
  sentryDiagnosticsAvailable = true;
  diagnosticsEnabled.value = true;
  addSnackbarMock.mockReset();
  clipboardWriteTextMock.mockReset();
  document.body.innerHTML = '';
  delete navigatorPrototypeWithUserAgentData.userAgentData;
  Object.defineProperty(navigator, 'userAgentData', {
    configurable: true,
    value: {
      platform: 'UnitTestOS',
    },
  });
});

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
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
