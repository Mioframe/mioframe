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

it('renders the local-first and privacy help content in-app', async () => {
  const { default: DataStoragePrivacyPane } = await import('./DataStoragePrivacyPane.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(DataStoragePrivacyPane);

  app.mount(root);
  await nextTick();

  expect(root.textContent).toContain('Privacy policy');
  expect(root.textContent).toContain(
    'Mioframe is a local-first app for working with your own documents and records.',
  );
  expect(root.textContent).toContain('You can use Mioframe without creating a Mioframe account.');
  expect(root.textContent).toContain(
    'Your documents and records are stored in places you control:',
  );
  expect(root.textContent).toContain('in browser storage used by your browser for this app;');
  expect(root.textContent).toContain(
    'Mioframe does not send document contents, record values, document names, folder names, local folder paths, document ids, or file ids to the developer.',
  );
  expect(root.textContent).toContain('Google Drive integration is optional.');
  expect(root.textContent).toContain(
    'Mioframe can send technical error reports to Sentry when an error happens.',
  );
  expect(root.textContent).toContain(
    'You can enable or disable error diagnostics at any time in Settings under Error diagnostics.',
  );
  expect(root.textContent).toContain('Mioframe 0.1 does not use Sentry Session Replay.');
  expect(root.textContent).toContain('https://github.com/Vyachean/beaver/discussions');
  expect(root.textContent).toContain('https://github.com/Vyachean/beaver/issues');

  app.unmount();
  root.remove();
});

it('renders privacy markdown structure and safe external links', async () => {
  const { default: DataStoragePrivacyPane } = await import('./DataStoragePrivacyPane.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(DataStoragePrivacyPane);

  app.mount(root);
  await nextTick();

  expect(root.querySelector('h1')?.textContent).toBe('Privacy policy');
  const headings = Array.from(root.querySelectorAll('h1, h2'));
  expect(headings.some((heading) => heading.textContent === 'Privacy Policy')).toBe(true);
  expect(headings.some((heading) => heading.textContent === 'No Mioframe account')).toBe(true);
  expect(root.querySelectorAll('p').length).toBeGreaterThan(0);
  expect(root.querySelectorAll('li').length).toBeGreaterThan(0);

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
  const { default: DataStoragePrivacyPane } = await import('./DataStoragePrivacyPane.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(
    defineComponent({
      setup() {
        return () =>
          h(DataStoragePrivacyPane, null, {
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
