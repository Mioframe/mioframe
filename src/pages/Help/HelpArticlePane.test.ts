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
  getHelpArticleBySlug: (slug: string) =>
    slug === 'data/data-storage'
      ? {
          slug,
          title: 'Data storage',
          markdown: '# Data storage\n\nSee [Backup](./02-backup-and-restore.md).',
          sourcePath: 'data/01-data-storage.md',
          sourceDir: 'data',
        }
      : null,
  resolveHelpArticleHref: (currentPath: string, href: string) =>
    currentPath === 'data/01-data-storage.md' && href === './02-backup-and-restore.md'
      ? { slug: 'data/backup-and-restore', anchor: null }
      : null,
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
    props: { headline: { type: String, required: true } },
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

vi.mock('@page/MarkdownHelpPane/MarkdownHelpPane.vue', () => ({
  default: defineComponent({
    name: 'MarkdownHelpPaneStub',
    props: {
      headline: { type: String, required: true },
      markdown: { type: String, required: true },
      paneClass: { type: String, required: true },
    },
    emits: ['contentClick'],
    setup(props, { emit, slots }) {
      return () =>
        h('section', { class: props.paneClass }, [
          h('header', [
            h('div', { 'data-slot': 'leading-button' }, slots.navigationButton?.()),
            h('h1', props.headline),
            h('div', { 'data-slot': 'trailing-elements' }, slots.appBarTrailing?.()),
          ]),
          h('div', { class: 'markdown-help-pane__content' }, [
            h('p', props.markdown),
            h(
              'a',
              {
                href: './02-backup-and-restore.md',
                onClick: (event: MouseEvent) => {
                  emit('contentClick', event);
                },
              },
              'Backup',
            ),
          ]),
        ]);
    },
  }),
}));

const mountPane = async (slug: string) => {
  const { default: HelpArticlePane } = await import('./HelpArticlePane.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(HelpArticlePane, { slug });
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

describe('HelpArticlePane', () => {
  afterEach(() => {
    vi.resetModules();
    open.mockReset();
    document.body.innerHTML = '';
  });

  it('renders the selected article and preserves app bar slots', async () => {
    const { default: HelpArticlePane } = await import('./HelpArticlePane.vue');
    const root = document.createElement('div');
    document.body.appendChild(root);
    const app = createApp(
      defineComponent({
        setup() {
          return () =>
            h(
              HelpArticlePane,
              { slug: 'data/data-storage' },
              {
                navigationButton: () => h('button', { type: 'button' }, 'Back'),
              },
            );
        },
      }),
    );

    app.mount(root);
    await nextTick();

    expect(root.textContent).toContain('Data storage');
    expect(root.textContent).toContain('See [Backup](./02-backup-and-restore.md).');
    expect(root.querySelector('[data-slot="leading-button"]')?.textContent).toContain('Back');

    app.unmount();
    root.remove();
  });

  it('shows a clear not-found state for an unknown slug', async () => {
    const { root, unmount } = await mountPane('missing/article');

    expect(root.textContent).toContain('Help article not found');
    expect(root.textContent).toContain('The requested help article could not be found.');

    unmount();
  });

  it('opens in-app help navigation for relative markdown article links', async () => {
    const { root, unmount } = await mountPane('data/data-storage');

    root
      .querySelector('a')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await nextTick();

    expect(open).toHaveBeenCalledWith(
      'helpArticle',
      { slug: 'data/backup-and-restore', anchor: undefined },
      { target: 'helpArticle' },
    );

    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
