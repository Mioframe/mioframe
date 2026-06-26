/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';

const open = vi.fn();

vi.mock('@page/routes', () => ({
  useStackNavigation: () => ({
    open,
  }),
}));

vi.mock('./helpCatalog', () => ({
  helpCatalog: [
    { slug: 'data/data-storage', title: 'Data storage' },
    { slug: 'data/backup-and-restore', title: 'Backup and restore' },
    { slug: 'data/data-troubleshooting', title: 'Troubleshooting data problems' },
  ],
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
    props: { headline: { type: String, required: true } },
    setup(props, { slots }) {
      return () =>
        h('header', [h('h1', props.headline), slots.leadingButton?.(), slots.trailingElements?.()]);
    },
  }),
}));

vi.mock('@shared/ui/Lists', () => ({
  MDList: defineComponent({
    name: 'MDListStub',
    setup(_props, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
  MDListItem: defineComponent({
    name: 'MDListItemStub',
    props: {
      labelText: { type: String, required: true },
    },
    emits: ['action'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            onClick: () => {
              emit('action');
            },
          },
          props.labelText,
        );
    },
  }),
}));

const mountPane = async () => {
  const { default: HelpIndexPane } = await import('./HelpIndexPane.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(HelpIndexPane);
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

describe('HelpIndexPane', () => {
  afterEach(() => {
    vi.resetModules();
    open.mockReset();
    document.body.innerHTML = '';
  });

  it('renders catalog entries and opens the selected help article', async () => {
    const { root, unmount } = await mountPane();

    expect(root.textContent).toContain('Help');
    expect(root.textContent).toContain('Data storage');
    expect(root.textContent).toContain('Backup and restore');
    expect(root.textContent).toContain('Troubleshooting data problems');

    root.querySelectorAll('button')[1]?.click();
    await nextTick();

    expect(open).toHaveBeenCalledWith(
      'helpArticle',
      { slug: 'data/backup-and-restore' },
      { target: 'helpArticle' },
    );

    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
