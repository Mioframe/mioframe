/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';

const openMock = vi.hoisted(() => vi.fn());

const settings = ref<{ googleDriveIntegrationEnabled?: boolean }>({});
let googleDriveIntegrationAvailable = true;

vi.mock('@entity/localSettings', () => ({
  useLocalSettings: () => ({
    settings,
  }),
}));

vi.mock('@page/routes', () => ({
  useStackNavigation: () => ({
    open: openMock,
  }),
}));

vi.mock('@shared/service/google/useGoogleService', () => ({
  GOOGLE_DRIVE_ROOT_NAME: 'Google Drive',
}));

vi.mock('@shared/config', () => ({
  get GOOGLE_DRIVE_INTEGRATION_AVAILABLE() {
    return googleDriveIntegrationAvailable;
  },
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
    vi.resetModules();
    googleDriveIntegrationAvailable = true;
    settings.value = {};
    document.body.innerHTML = '';
    openMock.mockReset();
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

  it('hides the Google Drive widget when the saved setting is enabled but integration is unavailable', async () => {
    googleDriveIntegrationAvailable = false;
    settings.value = {
      googleDriveIntegrationEnabled: true,
    };

    const { root, unmount } = await mountHomePane();

    expect(root.querySelector('[data-testid="google-drive-widget"]')).toBeNull();

    unmount();
  });

  it('navigates to the document when StarterExamplesWidget emits createdDocument', async () => {
    const { default: HomePane } = await import('./HomePane.vue');
    const wrapper = mount(HomePane);

    await wrapper.findComponent({ name: 'StarterExamplesWidgetStub' }).vm.$emit('createdDocument', {
      documentDirectory: '/Examples',
      documentId: 'doc-1',
    });

    expect(openMock).toHaveBeenCalledWith(
      'document',
      { documentDirectory: '/Examples', documentId: 'doc-1' },
      { target: 'document' },
    );
  });

  it('navigates to the repo when LocalFSWidget emits click-path', async () => {
    const { default: HomePane } = await import('./HomePane.vue');
    const wrapper = mount(HomePane);

    await wrapper.findComponent({ name: 'LocalFSWidgetStub' }).vm.$emit('clickPath', '/my/path');

    expect(openMock).toHaveBeenCalledWith('repo', { repoPath: '/my/path' }, { target: 'repo' });
  });

  it('navigates to the repo when GoogleDriveWidget emits click-user', async () => {
    settings.value = { googleDriveIntegrationEnabled: true };
    googleDriveIntegrationAvailable = true;
    const { default: HomePane } = await import('./HomePane.vue');
    const wrapper = mount(HomePane);

    await wrapper
      .findComponent({ name: 'GoogleDriveWidgetStub' })
      .vm.$emit('clickUser', 'user@example.com');

    expect(openMock).toHaveBeenCalledWith(
      'repo',
      { repoPath: '/Google Drive/user@example.com' },
      { target: 'repo' },
    );
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
