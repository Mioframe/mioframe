/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';

const open = vi.fn();

vi.mock('@page/routes', () => ({
  useStackNavigation: () => ({
    open,
  }),
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
        default: undefined,
      },
    },
    setup(props, { slots }) {
      return () => h('header', [h('span', props.headline), slots.trailingElements?.()]);
    },
  }),
}));

vi.mock('@widget/SettingsSections', () => ({
  SettingsSections: defineComponent({
    name: 'SettingsSectionsStub',
    emits: ['openPrivacyHelp'],
    setup(_props, { emit }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            onClick: () => {
              emit('openPrivacyHelp');
            },
          },
          'Open privacy help',
        );
    },
  }),
}));

const mountSettingsPane = async () => {
  const { default: SettingsPane } = await import('./SettingsPane.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(SettingsPane);

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

describe('SettingsPane', () => {
  afterEach(() => {
    vi.resetModules();
    open.mockReset();
    document.body.innerHTML = '';
  });

  it('opens the in-app privacy help pane from Settings', async () => {
    const { root, unmount } = await mountSettingsPane();

    root.querySelector('button')?.click();
    await nextTick();

    expect(open).toHaveBeenCalledWith('privacyHelp', {}, { target: 'settings' });

    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
