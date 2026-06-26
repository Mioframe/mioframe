/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';

declare global {
  interface Window {
    /** Present only in the happy-dom test environment. */
    happyDOM: { settings: { navigation: { disableMainFrameNavigation: boolean } } };
  }
}

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
  resolveHelpArticleHref: (currentPath: string, href: string) => {
    if (currentPath !== 'data/01-data-storage.md') {
      return null;
    }
    if (href === './02-backup-and-restore.md') {
      return { slug: 'data/backup-and-restore', anchor: null };
    }
    if (href === './02-backup-and-restore.md#export-json') {
      return { slug: 'data/backup-and-restore', anchor: 'export-json' };
    }
    return null;
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

vi.mock('./HelpArticleBody.vue', () => ({
  default: defineComponent({
    name: 'HelpArticleBodyStub',
    props: {
      markdown: { type: String, required: true },
    },
    emits: ['contentClick'],
    setup(props, { emit }) {
      // Matches the real component: a single click listener on the article container, relying
      // on native event bubbling, so the guard logic in `onContentClick` is exercised the same
      // way it is in production (clicks on plain text vs. on a nested anchor).
      return () =>
        h(
          'div',
          {
            class: 'help-article-body',
            onClick: (event: MouseEvent) => {
              emit('contentClick', event);
            },
          },
          [
            h('p', props.markdown),
            h('a', { href: './02-backup-and-restore.md' }, 'Backup'),
            h('a', { href: './02-backup-and-restore.md#export-json' }, 'Export JSON section'),
            h(
              'a',
              { href: 'https://example.com/help', target: '_blank', rel: 'noopener noreferrer' },
              'External help',
            ),
          ],
        );
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
  let originalDisableMainFrameNavigation: boolean;

  beforeAll(() => {
    originalDisableMainFrameNavigation =
      window.happyDOM.settings.navigation.disableMainFrameNavigation;
    // Un-hijacked external links must keep the browser's native click behavior; disable
    // happy-dom's actual main-frame navigation so that native behavior doesn't perform a real
    // network request in this Node test environment.
    window.happyDOM.settings.navigation.disableMainFrameNavigation = true;
  });

  afterAll(() => {
    window.happyDOM.settings.navigation.disableMainFrameNavigation =
      originalDisableMainFrameNavigation;
  });

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

  it('opens in-app help navigation with the resolved anchor for a heading link', async () => {
    const { root, unmount } = await mountPane('data/data-storage');

    root
      .querySelectorAll('a')[1]
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await nextTick();

    expect(open).toHaveBeenCalledWith(
      'helpArticle',
      { slug: 'data/backup-and-restore', anchor: 'export-json' },
      { target: 'helpArticle' },
    );

    unmount();
  });

  it('does not hijack an external link: no in-app navigation and the click stays unprevented', async () => {
    const { root, unmount } = await mountPane('data/data-storage');

    const externalLink = root.querySelectorAll('a')[2];
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    externalLink?.dispatchEvent(clickEvent);
    await nextTick();

    expect(open).not.toHaveBeenCalled();
    expect(clickEvent.defaultPrevented).toBe(false);
    expect(externalLink?.getAttribute('target')).toBe('_blank');
    expect(externalLink?.getAttribute('rel')).toBe('noopener noreferrer');

    unmount();
  });

  it('does not navigate when the click lands on plain text rather than on a link', async () => {
    const { root, unmount } = await mountPane('data/data-storage');

    root
      .querySelector('p')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await nextTick();

    expect(open).not.toHaveBeenCalled();

    unmount();
  });

  it('does not navigate when the click event was already default-prevented', async () => {
    const { root, unmount } = await mountPane('data/data-storage');

    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    clickEvent.preventDefault();
    root.querySelector('a')?.dispatchEvent(clickEvent);
    await nextTick();

    expect(open).not.toHaveBeenCalled();

    unmount();
  });

  it('does not navigate on a non-primary mouse button click', async () => {
    const { root, unmount } = await mountPane('data/data-storage');

    root
      .querySelector('a')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 1 }));
    await nextTick();

    expect(open).not.toHaveBeenCalled();

    unmount();
  });

  it.each([
    ['metaKey', { metaKey: true }],
    ['ctrlKey', { ctrlKey: true }],
    ['shiftKey', { shiftKey: true }],
    ['altKey', { altKey: true }],
  ] as const)('does not navigate when %s is held during the click', async (_name, modifier) => {
    const { root, unmount } = await mountPane('data/data-storage');

    root
      .querySelector('a')
      ?.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ...modifier }));
    await nextTick();

    expect(open).not.toHaveBeenCalled();

    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
