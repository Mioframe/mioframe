/* eslint-disable vue/one-component-per-file -- This test file intentionally defines several tiny inline stub components. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';

const deviceFiles = ref<Array<{ name: string; description?: string; canDisconnect: boolean }>>([]);
const disconnectDeviceDirectoryMock = vi.fn();
const enableStorageMock = vi.fn();
const persistenceStatus = ref<'checking' | 'ordinary' | 'persistent' | 'unsupported'>('checking');
const isRequesting = ref(false);

vi.mock('@shared/service/directories', () => ({
  OPFSName: 'Browser Storage',
}));

vi.mock('@entity/mountedDirectories', () => ({
  DEVICE_FILES: 'Device files',
  useFileSystem: () => ({
    deviceFiles,
  }),
}));

vi.mock('@entity/browserStoragePersistence', () => ({
  useBrowserStoragePersistence: () => ({
    status: persistenceStatus,
    isRequesting,
    requestPersistence: enableStorageMock,
    refresh: vi.fn(),
  }),
}));

vi.mock('@feature/deviceDirectoryDisconnect', () => ({
  useDisconnectDeviceDirectory: () => ({
    disconnectDeviceDirectory: disconnectDeviceDirectoryMock,
  }),
}));

vi.mock('@feature/browserStoragePersistenceEnable', () => ({
  useBrowserStoragePersistenceEnable: () => ({
    enableStorage: enableStorageMock,
    isRequesting,
  }),
}));

vi.mock('@feature/mioframeSpacePick', () => ({
  MioframeSpaceCreateListItem: defineComponent({
    name: 'MioframeSpaceCreateListItemStub',
    setup() {
      return () =>
        h('button', { 'data-testid': 'mioframe-create-space-list-item' }, [
          'Create space',
          h('span', 'Choose where Mioframe should create a new folder for your documents.'),
        ]);
    },
  }),
  MioframeSpaceOpenListItem: defineComponent({
    name: 'MioframeSpaceOpenListItemStub',
    setup() {
      return () =>
        h('button', { 'data-testid': 'mioframe-open-space-list-item' }, [
          'Open space',
          h('span', 'Choose a folder that already contains a Mioframe space.'),
        ]);
    },
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
      is: {
        type: String,
        default: 'div',
      },
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
          props.is === 'button' ? 'button' : 'div',
          {
            'data-headline': props.headline,
            disabled: props.disabled || undefined,
            onClick: () => {
              emit('click');
            },
          },
          [
            h('span', props.headline),
            props.supportingText ? h('span', props.supportingText) : null,
            slots.leadingIcon?.(),
            slots.supportingText?.(),
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
    persistenceStatus.value = 'checking';
    isRequesting.value = false;
    disconnectDeviceDirectoryMock.mockReset();
    enableStorageMock.mockReset();
    document.body.innerHTML = '';
  });

  it('mounts Mioframe create and open flows as feature-owned list items', async () => {
    const wrapper = await mountLocalFSWidget();

    expect(wrapper.findAll('[data-testid="mioframe-create-space-list-item"]')).toHaveLength(1);
    expect(wrapper.findAll('[data-testid="mioframe-open-space-list-item"]')).toHaveLength(1);
    expect(wrapper.text()).toContain('Create space');
    expect(wrapper.text()).toContain(
      'Choose where Mioframe should create a new folder for your documents.',
    );
    expect(wrapper.text()).toContain('Open space');
    expect(wrapper.text()).toContain('Choose a folder that already contains a Mioframe space.');
    expect(wrapper.find('[data-testid="mioframe-space-pick-dialogs"]').exists()).toBe(false);
  });

  it('does not know Mioframe space picker internals', async () => {
    const wrapper = await mountLocalFSWidget();

    expect(wrapper.text()).not.toContain('Name new space');
    expect(wrapper.text()).not.toContain('Create or open Mioframe space');
    expect(wrapper.text()).not.toContain('Add Local Directory');
    expect(wrapper.text()).not.toContain('Mounting user directory');
    expect(wrapper.text()).not.toContain('Create Mioframe folder');
    expect(wrapper.text()).not.toContain('local directory');
    expect(wrapper.text()).not.toContain('stored directly in that folder');
  });

  it('renders mounted local-space descriptions from the entity contract', async () => {
    deviceFiles.value = [
      { name: 'My Space', description: 'Mioframe space on this device', canDisconnect: true },
    ];

    const wrapper = await mountLocalFSWidget();

    expect(wrapper.text()).toContain('My Space');
    expect(wrapper.text()).toContain('Mioframe space on this device');
    expect(wrapper.text()).toContain('Disconnect Mioframe space');
    expect(wrapper.text()).not.toContain('Reconnect');
    expect(wrapper.text()).not.toContain('Grant access');
  });

  it('keeps the browser-saved space description for the built-in browser entry', async () => {
    deviceFiles.value = [
      {
        name: 'Browser Storage',
        description: 'Saved directly in your browser on this device',
        canDisconnect: false,
      },
    ];

    const wrapper = await mountLocalFSWidget();

    expect(wrapper.text()).toContain('Saved directly in your browser on this device');
    expect(wrapper.text()).not.toContain('Mioframe space on this device');
  });

  it('keeps a user-mounted Browser Storage folder disconnectable and the built-in browser entry protected', async () => {
    deviceFiles.value = [
      {
        name: 'Browser Storage',
        description: 'Saved directly in your browser on this device',
        canDisconnect: false,
      },
      {
        name: 'Browser Storage (2)',
        description: 'Mioframe space on this device',
        canDisconnect: true,
      },
    ];

    const wrapper = await mountLocalFSWidget();
    const disconnectButtons = wrapper.findAll('button[title="Disconnect Mioframe space"]');

    expect(wrapper.text()).toContain('Browser Storage');
    expect(wrapper.text()).toContain('Browser Storage (2)');

    await Promise.all(disconnectButtons.map((button) => button.trigger('click')));

    expect(disconnectDeviceDirectoryMock.mock.calls).toEqual([['Browser Storage (2)']]);
  });

  it('does not emit clickPath when the trailing disconnect action is clicked', async () => {
    deviceFiles.value = [
      { name: 'My Space', description: 'Mioframe space on this device', canDisconnect: true },
    ];

    const wrapper = await mountLocalFSWidget();

    await wrapper.get('button[title="Disconnect Mioframe space"]').trigger('click');

    expect(disconnectDeviceDirectoryMock).toHaveBeenCalledWith('My Space');
    expect(wrapper.emitted('clickPath')).toBeUndefined();
  });

  it('shows "Enable more reliable storage" action for the browser entry in ordinary state', async () => {
    persistenceStatus.value = 'ordinary';
    deviceFiles.value = [
      {
        name: 'Browser Storage',
        description: 'Saved directly in your browser on this device',
        canDisconnect: false,
      },
    ];

    const wrapper = await mountLocalFSWidget();

    const enableButton = wrapper.find('[data-headline="Enable more reliable storage"]');
    expect(enableButton.exists()).toBe(true);
    expect(enableButton.element.tagName).toBe('BUTTON');
    expect(wrapper.text()).toContain('Enable more reliable storage');
  });

  it('does not emit clickPath when the enable storage action is clicked', async () => {
    persistenceStatus.value = 'ordinary';
    enableStorageMock.mockResolvedValue(undefined);
    deviceFiles.value = [
      {
        name: 'Browser Storage',
        description: 'Saved directly in your browser on this device',
        canDisconnect: false,
      },
    ];

    const wrapper = await mountLocalFSWidget();

    await wrapper.find('[data-headline="Enable more reliable storage"]').trigger('click');

    expect(enableStorageMock).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted('clickPath')).toBeUndefined();
  });

  it('shows "More reliable storage enabled" info item for the browser entry in persistent state', async () => {
    persistenceStatus.value = 'persistent';
    deviceFiles.value = [
      {
        name: 'Browser Storage',
        description: 'Saved directly in your browser on this device',
        canDisconnect: false,
      },
    ];

    const wrapper = await mountLocalFSWidget();

    expect(wrapper.text()).toContain('More reliable storage enabled');
    expect(wrapper.find('[data-headline="Enable more reliable storage"]').exists()).toBe(false);
  });

  it('shows "More reliable storage unavailable" info item for the browser entry in unsupported state', async () => {
    persistenceStatus.value = 'unsupported';
    deviceFiles.value = [
      {
        name: 'Browser Storage',
        description: 'Saved directly in your browser on this device',
        canDisconnect: false,
      },
    ];

    const wrapper = await mountLocalFSWidget();

    expect(wrapper.text()).toContain('More reliable storage unavailable');
    expect(wrapper.find('[data-headline="Enable more reliable storage"]').exists()).toBe(false);
  });

  it('shows no persistence status item while checking', async () => {
    persistenceStatus.value = 'checking';
    deviceFiles.value = [
      {
        name: 'Browser Storage',
        description: 'Saved directly in your browser on this device',
        canDisconnect: false,
      },
    ];

    const wrapper = await mountLocalFSWidget();

    expect(wrapper.find('[data-headline="Enable more reliable storage"]').exists()).toBe(false);
    expect(wrapper.find('[data-headline="More reliable storage enabled"]').exists()).toBe(false);
    expect(wrapper.find('[data-headline="More reliable storage unavailable"]').exists()).toBe(
      false,
    );
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
