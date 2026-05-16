/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { describe, expect, it, vi } from 'vitest';
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

const mountPane = async (
  paneImport: Promise<{ default: ReturnType<typeof defineComponent> }>,
  slots?: { navigationButton?: () => unknown },
) => {
  const { default: PaneComponent } = await paneImport;
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(
    defineComponent({
      setup() {
        return () => h(PaneComponent, null, slots ?? {});
      },
    }),
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

describe('data help panes', () => {
  it('renders the data storage markdown in-app', async () => {
    const { root, unmount } = await mountPane(import('./DataStoragePane.vue'));

    expect(root.querySelector('h1')?.textContent).toBe('Data storage');
    expect(root.textContent).toContain('Mioframe is local-first.');
    expect(root.textContent).toContain('Browser Storage');
    expect(root.textContent).toContain('Local folders');
    expect(root.textContent).toContain('Google Drive');
    expect(root.textContent).toContain('Export JSON');
    expect(root.textContent).not.toContain('full workspace backup');
    expect(root.querySelector('.markdown-help-pane__content h1')).toBeNull();

    unmount();
  });

  it('renders the backup and restore markdown in-app', async () => {
    const { root, unmount } = await mountPane(
      import('../BackupAndRestorePane/BackupAndRestorePane.vue'),
    );

    expect(root.querySelector('h1')?.textContent).toBe('Backup and restore');
    expect(root.textContent).toContain('Export JSON');
    expect(root.textContent).toContain('Import JSON');
    expect(root.textContent).toContain('document-level only');
    expect(root.textContent).toContain('not a full workspace backup or full workspace restore');

    unmount();
  });

  it('renders the troubleshooting markdown in-app', async () => {
    const { root, unmount } = await mountPane(
      import('../DataTroubleshootingPane/DataTroubleshootingPane.vue'),
    );

    expect(root.querySelector('h1')?.textContent).toBe('Troubleshooting data problems');
    expect(root.textContent).toContain('not valid JSON');
    expect(root.textContent).toContain('not a Mioframe document');
    expect(root.textContent).toContain('Browser Storage data disappeared');
    expect(root.textContent).toContain('Mioframe probably cannot recover');
    expect(root.textContent).toContain('Backup and restore');

    unmount();
  });

  it('renders the navigation button slot in the app bar leading button area', async () => {
    const { root, unmount } = await mountPane(import('./DataStoragePane.vue'), {
      navigationButton: () => h('button', { type: 'button' }, 'Back'),
    });

    const leadingButtonSlot = root.querySelector('[data-slot="leading-button"]');
    expect(leadingButtonSlot?.textContent).toContain('Back');

    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
