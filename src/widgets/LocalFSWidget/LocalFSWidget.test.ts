/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';

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
            onClick: (event: MouseEvent) => {
              emit('click', event);
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
      lines: {
        type: Number,
        default: undefined,
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
            props.lines ? h('span', `lines:${props.lines}`) : null,
            slots.leadingIcon?.(),
            slots.trailingIcon?.(),
          ],
        );
    },
  }),
}));

const mountLocalFSWidget = async () => {
  const { default: LocalFSWidget } = await import('./LocalFSWidget.vue');
  return mount(LocalFSWidget);
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
    const wrapper = await mountLocalFSWidget();

    expect(wrapper.text()).toContain('Create space');
    expect(wrapper.text()).toContain(
      'Create or select a folder. Mioframe files will be stored directly in that folder.',
    );
    expect(wrapper.text()).toContain('Open space');
    expect(wrapper.text()).toContain(
      'Select a folder that already contains the current Mioframe space files.',
    );
    expect(wrapper.text()).toContain('lines:2');
    expect(wrapper.text()).not.toContain('Create or open Mioframe space');
    expect(wrapper.text()).not.toContain('Add Local Directory');
    expect(wrapper.text()).not.toContain('Mounting user directory');
    expect(wrapper.text()).not.toContain('Create Mioframe folder');
    expect(wrapper.text()).not.toContain('local directory');
  });

  it('renders mounted local-space descriptions from the entity contract', async () => {
    deviceFiles.value = [{ name: 'My Space', description: 'Mioframe space on this device' }];

    const wrapper = await mountLocalFSWidget();

    expect(wrapper.text()).toContain('My Space');
    expect(wrapper.text()).toContain('Mioframe space on this device');
    expect(wrapper.text()).toContain('Disconnect Mioframe space');
  });

  it('keeps the browser-saved space description for the built-in browser entry', async () => {
    deviceFiles.value = [
      { name: 'Browser Storage', description: 'Saved directly in your browser on this device' },
    ];

    const wrapper = await mountLocalFSWidget();

    expect(wrapper.text()).toContain('Saved directly in your browser on this device');
    expect(wrapper.text()).not.toContain('Mioframe space on this device');
  });

  it('keeps a user-mounted Browser Storage folder disconnectable and the built-in browser entry protected', async () => {
    deviceFiles.value = [
      { name: 'Browser Storage', description: 'Saved directly in your browser on this device' },
      { name: 'Browser Storage (2)', description: 'Mioframe space on this device' },
    ];

    const wrapper = await mountLocalFSWidget();
    const disconnectButtons = wrapper.findAll('button[title="Disconnect Mioframe space"]');

    expect(wrapper.text()).toContain('Browser Storage');
    expect(wrapper.text()).toContain('Browser Storage (2)');

    await Promise.all(disconnectButtons.map((button) => button.trigger('click')));

    expect(disconnectDeviceDirectoryMock.mock.calls).toEqual([['Browser Storage (2)']]);
  });

  it('does not emit clickPath when the trailing disconnect action is clicked', async () => {
    deviceFiles.value = [{ name: 'My Space', description: 'Mioframe space on this device' }];

    const wrapper = await mountLocalFSWidget();

    await wrapper.get('button[title="Disconnect Mioframe space"]').trigger('click');

    expect(disconnectDeviceDirectoryMock).toHaveBeenCalledWith('My Space');
    expect(wrapper.emitted('clickPath')).toBeUndefined();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
