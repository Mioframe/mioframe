/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';

const settings = ref<{ googleDriveIntegrationEnabled?: boolean }>({});

vi.mock('@entity/localSettings', () => ({
  useLocalSettings: () => ({
    settings,
  }),
}));

vi.mock('@page/routes', () => ({
  useStackNavigation: () => ({
    open: vi.fn(),
  }),
}));

vi.mock('@shared/service/google/useGoogleService', () => ({
  GOOGLE_DRIVE_ROOT_NAME: 'Google Drive',
}));

vi.mock('@shared/ui/Layout', () => ({
  MDPane: defineComponent({
    name: 'MDPaneStub',
    setup(_props, { slots }) {
      return () => h('section', { 'data-testid': 'pane' }, slots.default?.());
    },
  }),
}));

vi.mock('@shared/ui/AppBar', () => ({
  MDAppBar: defineComponent({
    name: 'MDAppBarStub',
    setup(_props, { slots }) {
      return () => h('header', { 'data-testid': 'app-bar' }, slots.trailingElements?.());
    },
  }),
}));

vi.mock('@widget/StarterExamplesWidget', () => ({
  StarterExamplesWidget: defineComponent({
    name: 'StarterExamplesWidgetStub',
    setup() {
      return () => h('div', { 'data-testid': 'starter-examples-widget' });
    },
  }),
}));

vi.mock('@widget/LocalFSWidget', () => ({
  LocalFSWidget: defineComponent({
    name: 'LocalFSWidgetStub',
    setup() {
      return () => h('div', { 'data-testid': 'local-fs-widget' });
    },
  }),
}));

vi.mock('@widget/GoogleDriveWidget', () => ({
  GoogleDriveWidget: defineComponent({
    name: 'GoogleDriveWidgetStub',
    setup() {
      return () => h('div', { 'data-testid': 'google-drive-widget' });
    },
  }),
}));

const mountHomePane = async () => {
  const { default: HomePane } = await import('./HomePane.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(HomePane);

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

describe('HomePane', () => {
  afterEach(() => {
    settings.value = {};
    document.body.innerHTML = '';
  });

  it('hides the Google Drive widget when integration is not explicitly enabled', async () => {
    settings.value = {};

    const { root, unmount } = await mountHomePane();

    expect(root.querySelector('[data-testid="google-drive-widget"]')).toBeNull();

    unmount();
  });

  it('shows the Google Drive widget when integration is explicitly enabled', async () => {
    settings.value = {
      googleDriveIntegrationEnabled: true,
    };

    const { root, unmount } = await mountHomePane();

    expect(root.querySelector('[data-testid="google-drive-widget"]')).not.toBeNull();

    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
