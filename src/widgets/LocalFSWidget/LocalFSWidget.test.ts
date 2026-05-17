/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createApp, defineComponent, h, nextTick, ref } from 'vue';

const deviceFiles = ref<Array<{ name: string; description?: string }>>([]);
const disconnectDeviceDirectoryMock = vi.fn();
const createSpaceMock = vi.fn();
const openSpaceMock = vi.fn();

vi.mock('@entity/mountedDirectories', () => ({
  DEVICE_FILES: 'Device files',
  useFileSystem: () => ({
    deviceFiles,
  }),
}));

vi.mock('@feature/deviceDirectoryDisconnect', () => ({
  useDisconnectDeviceDirectory: () => ({
    disconnectDeviceDirectory: disconnectDeviceDirectoryMock,
  }),
}));

vi.mock('@feature/mioframeSpacePick', () => ({
  usePickMioframeSpace: () => ({
    loading: false,
    createSpace: createSpaceMock,
    openSpace: openSpaceMock,
  }),
}));

vi.mock('@shared/ui/Button', () => ({
  MDIconButton: defineComponent({
    name: 'MDIconButtonStub',
    props: {
      tooltip: {
        type: String,
        default: undefined,
      },
    },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            title: props.tooltip,
            onClick: () => {
              emit('click');
            },
          },
          props.tooltip,
        );
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

vi.mock('@shared/ui/Lists', () => ({
  MDListContainer: defineComponent({
    name: 'MDListContainerStub',
    setup(_props, { slots }) {
      return () => h('section', slots.default?.());
    },
  }),
  MDListItem: defineComponent({
    name: 'MDListItemStub',
    props: {
      headline: {
        type: String,
        required: true,
      },
      supportingText: {
        type: String,
        default: undefined,
      },
      disabled: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            disabled: props.disabled,
            onClick: () => {
              emit('click');
            },
          },
          [
            h('span', props.headline),
            props.supportingText ? h('span', props.supportingText) : null,
            slots.leadingIcon?.(),
            slots.trailingIcon?.(),
          ],
        );
    },
  }),
}));

const mountLocalFSWidget = async () => {
  const { default: LocalFSWidget } = await import('./LocalFSWidget.vue');
  const root = document.createElement('div');
  document.body.appendChild(root);
  const app = createApp(LocalFSWidget);

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

describe('LocalFSWidget', () => {
  afterEach(() => {
    vi.resetModules();
    deviceFiles.value = [];
    disconnectDeviceDirectoryMock.mockReset();
    createSpaceMock.mockReset();
    openSpaceMock.mockReset();
    document.body.innerHTML = '';
  });

  it('renders separate create and open Mioframe space actions with updated copy', async () => {
    const { root, unmount } = await mountLocalFSWidget();

    expect(root.textContent).toContain('Create space');
    expect(root.textContent).toContain(
      'Create or select a new folder. The folder name will be used as the space name.',
    );
    expect(root.textContent).toContain('Open space');
    expect(root.textContent).toContain('Select an existing Mioframe space folder.');
    expect(root.textContent).not.toContain('Create or open Mioframe space');
    expect(root.textContent).not.toContain('Add Local Directory');
    expect(root.textContent).not.toContain('Mounting user directory');
    expect(root.textContent).not.toContain('Create Mioframe folder');

    unmount();
  });

  it('shows the Mioframe disconnect tooltip for mounted spaces', async () => {
    deviceFiles.value = [{ name: 'My Space', description: 'Mioframe space' }];

    const { root, unmount } = await mountLocalFSWidget();

    expect(root.textContent).toContain('Disconnect Mioframe space');

    unmount();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
