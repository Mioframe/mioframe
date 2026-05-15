/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';

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

it('renders the data storage and recovery help content in-app', async () => {
  const { default: DataStorageHelpPane } = await import('./DataStorageHelpPane.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(DataStorageHelpPane);

  app.mount(root);
  await nextTick();

  expect(root.textContent).toContain('Data storage & recovery');
  expect(root.textContent).toContain('Browser Storage');
  expect(root.textContent).toMatch(/local folders/i);
  expect(root.textContent).toContain('Export JSON');
  expect(root.textContent).toContain('Import JSON');
  expect(root.textContent).toMatch(/GitHub (Discussions|Issues)/);

  app.unmount();
  root.remove();
});

it('renders help markdown structure and safe external links', async () => {
  const { default: DataStorageHelpPane } = await import('./DataStorageHelpPane.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(DataStorageHelpPane);

  app.mount(root);
  await nextTick();

  expect(root.querySelector('h1')?.textContent).toBe('Data storage & recovery');
  const headings = Array.from(root.querySelectorAll('h1, h2'));
  expect(headings.some((heading) => heading.textContent === 'Data storage and recovery')).toBe(
    false,
  );
  expect(headings.some((heading) => heading.textContent === 'Browser Storage')).toBe(true);
  expect(headings.some((heading) => heading.textContent === 'Local folders')).toBe(true);
  expect(headings.some((heading) => heading.textContent === 'Questions and problems')).toBe(true);

  const links = Array.from(root.querySelectorAll('a'));
  expect(links).toHaveLength(2);
  expect(links[0]?.getAttribute('href')).toBe('https://github.com/Vyachean/beaver/discussions');
  expect(links[0]?.getAttribute('target')).toBe('_blank');
  expect(links[0]?.getAttribute('rel')).toBe('noopener noreferrer');
  expect(links[1]?.getAttribute('href')).toBe('https://github.com/Vyachean/beaver/issues');
  expect(links[1]?.getAttribute('target')).toBe('_blank');
  expect(links[1]?.getAttribute('rel')).toBe('noopener noreferrer');

  app.unmount();
  root.remove();
});

it('renders the navigation button slot in the app bar leading button area', async () => {
  const { default: DataStorageHelpPane } = await import('./DataStorageHelpPane.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(DataStorageHelpPane, null, {
            navigationButton: () => h('button', { type: 'button' }, 'Back'),
          });
      },
    }),
  );

  app.mount(root);
  await nextTick();

  const leadingButtonSlot = root.querySelector('[data-slot="leading-button"]');
  expect(leadingButtonSlot?.textContent).toContain('Back');

  app.unmount();
  root.remove();
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
