/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick } from 'vue';

vi.mock('@shared/ui/Dialog', () => ({
  MDDialog: defineComponent({
    name: 'MDDialogStub',
    props: {
      headline: {
        type: String,
        required: true,
      },
      supportingText: {
        type: String,
        required: true,
      },
      applyLabel: {
        type: String,
        default: undefined,
      },
      cancelLabel: {
        type: String,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('section', [
          h('h1', props.headline),
          h('p', props.supportingText),
          props.applyLabel ? h('button', props.applyLabel) : null,
          props.cancelLabel ? h('button', props.cancelLabel) : null,
          slots.actions?.(),
        ]);
    },
  }),
}));

vi.mock('@shared/ui/Button', () => ({
  MDButton: defineComponent({
    name: 'MDButtonStub',
    props: {
      label: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      return () => h('button', props.label);
    },
  }),
}));

vi.mock('@shared/ui/Icon', () => ({
  MDSymbol: defineComponent({
    name: 'MDSymbolStub',
    setup() {
      return () => h('span');
    },
  }),
}));

const mountDialog = async (state: Record<string, unknown> = { kind: 'entry' }) => {
  const { default: MioframeSpacePickDialog } = await import('./MioframeSpacePickDialog.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(MioframeSpacePickDialog, {
    state,
  });

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

describe('MioframeSpacePickDialog', () => {
  afterEach(() => {
    vi.resetModules();
    document.body.innerHTML = '';
  });

  it('uses Mioframe product copy instead of old local-directory copy', async () => {
    const { root, unmount } = await mountDialog();

    expect(root.textContent).toContain('Where should Mioframe store documents?');
    expect(root.textContent).toContain('Create new space');
    expect(root.textContent).toContain('Open existing space');
    expect(root.textContent).not.toContain('Add Local Directory');
    expect(root.textContent).not.toContain('Mounting user directory');

    unmount();
  });

  it('renders the dedicated create-space copy', async () => {
    const { root, unmount } = await mountDialog({ kind: 'create' });

    expect(root.textContent).toContain('Create Mioframe folder');
    expect(root.textContent).toContain('Recommended: My Drive / Mioframe');
    expect(root.textContent).toContain('Create Mioframe folder');
    expect(root.textContent).toContain('Choose another location');

    unmount();
  });

  it('renders the warning actions for broad folders', async () => {
    const { root, unmount } = await mountDialog({
      kind: 'warning',
      handle: { name: 'Documents' },
      headline: 'Use the whole Documents folder?',
      supportingText: 'Mioframe will store documents and service files directly in this folder.',
    });

    expect(root.textContent).toContain('Create Mioframe subfolder');
    expect(root.textContent).toContain('Use this folder');
    expect(root.textContent).toContain('Cancel');

    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
