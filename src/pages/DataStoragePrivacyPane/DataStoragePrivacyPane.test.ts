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

  expect(root.textContent).toContain('Data storage and privacy');
  expect(root.textContent).toContain('Mioframe 0.1 is local-first.');
  expect(root.textContent).toContain(
    'Documents are stored in browser storage or in folders that you explicitly choose.',
  );
  expect(root.textContent).toContain(
    'Google Drive is optional and is used only after you enable the integration and connect a Google account.',
  );
  expect(root.textContent).toContain(
    'Turning off Google Drive in Settings only disables the integration inside this app. It does not revoke access from Google.',
  );
  expect(root.textContent).toContain('You can use the app without creating a Mioframe account.');

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
