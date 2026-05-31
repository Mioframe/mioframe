/* eslint-disable vue/one-component-per-file -- Focused pane contract test with inline stubs. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { DeviceDirectoryAccessRequiredError } from '@shared/service/fileSystem';

const canEditChildren = ref(true);
const repositoryFactsError = ref<unknown>();
const repositoryVisibleEntriesError = ref<unknown>();
const {
  getDeviceDirectoryAccessRequestMock,
  openMock,
  importDocumentMock,
  resolveDeviceDirectoryAccessRequestMock,
} = vi.hoisted(() => ({
  getDeviceDirectoryAccessRequestMock: vi.fn(),
  openMock: vi.fn(),
  importDocumentMock: vi.fn(),
  resolveDeviceDirectoryAccessRequestMock: vi.fn(),
}));

type MockPermissionDirectoryHandle = FileSystemDirectoryHandle & {
  requestPermissionMock: ReturnType<
    typeof vi.fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>
  >;
};

const createPermissionHandle = (
  permissionState: PermissionState,
): MockPermissionDirectoryHandle => {
  const requestPermissionMock = vi.fn(() => Promise.resolve(permissionState));

  const handle: MockPermissionDirectoryHandle = {
    kind: 'directory',
    name: 'Work',
    isSameEntry: vi.fn(() => Promise.resolve(false)),
    requestPermission: requestPermissionMock,
    requestPermissionMock,
    queryPermission: vi.fn(() => Promise.resolve(permissionState)),
    isFile: false,
    isDirectory: true,
    entries: vi.fn(),
    keys: vi.fn(),
    values: vi.fn(),
    getDirectoryHandle: vi.fn(),
    getFileHandle: vi.fn(),
    removeEntry: vi.fn(),
    resolve: vi.fn(),
    getFile(fileName: string, options?: FileSystemGetFileOptions) {
      return this.getFileHandle(fileName, options);
    },
    getDirectory(directoryName: string, options?: FileSystemGetDirectoryOptions) {
      return this.getDirectoryHandle(directoryName, options);
    },
    getEntries() {
      return this.values();
    },
    [Symbol.asyncIterator]() {
      return this.entries();
    },
  };

  return handle;
};

vi.mock('@entity/fsEntry', () => ({
  useFSNodeStat: () => ({
    data: ref({
      capabilities: {
        canEditChildren: canEditChildren.value,
      },
    }),
  }),
}));

vi.mock('@page/routes', () => ({
  useStackNavigation: () => ({
    open: openMock,
  }),
}));

vi.mock('@entity/localSettings', () => ({
  useLocalSettings: () => ({
    settings: ref({
      showAutomergeFiles: false,
    }),
  }),
}));

vi.mock('@entity/repository', () => ({
  useRepository: () => ({
    repositoryFactsError,
    repositoryVisibleEntriesError,
  }),
}));

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      getDeviceDirectoryAccessRequest: getDeviceDirectoryAccessRequestMock,
      resolveDeviceDirectoryAccessRequest: resolveDeviceDirectoryAccessRequestMock,
    },
  }),
}));

vi.mock('@feature/directoryCreate', () => ({
  DirectoryCreateDialog: defineComponent({
    name: 'DirectoryCreateDialogStub',
    setup() {
      return () => h('div', { 'data-testid': 'directory-create-dialog' });
    },
  }),
}));

vi.mock('@feature/entryAdd', () => ({
  EntryAddSheet: defineComponent({
    name: 'EntryAddSheetStub',
    emits: ['close', 'selectCreateDirectory', 'selectCreateDocument', 'selectImportDocument'],
    setup(_props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'entry-add-sheet' }, [
          h(
            'button',
            {
              onClick: () => {
                emit('selectCreateDirectory');
              },
            },
            'Create directory from sheet',
          ),
          h(
            'button',
            {
              onClick: () => {
                emit('selectCreateDocument');
              },
            },
            'Create document from sheet',
          ),
          h(
            'button',
            {
              onClick: () => {
                emit('selectImportDocument');
              },
            },
            'Import from sheet',
          ),
          h(
            'button',
            {
              onClick: () => {
                emit('close');
              },
            },
            'Close sheet',
          ),
        ]);
    },
  }),
}));

vi.mock('@feature/documentCreate', () => ({
  DocumentCreationDialog: defineComponent({
    name: 'DocumentCreationDialogStub',
    setup() {
      return () => h('div', { 'data-testid': 'document-create-dialog' });
    },
  }),
}));

vi.mock('@feature/importDocument', () => ({
  useImportDocumentAction: () => ({
    importDocument: importDocumentMock,
  }),
}));

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: vi.fn(),
  }),
}));

vi.mock('@shared/lib/reportHandledError', () => ({
  reportHandledError: vi.fn(),
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
    props: {
      headline: {
        type: String,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('header', [h('h1', props.headline), slots.trailingElements?.(), slots.default?.()]);
    },
  }),
}));

vi.mock('@shared/ui/Button', () => ({
  MDExtendedFab: defineComponent({
    name: 'MDExtendedFabStub',
    props: {
      tooltip: {
        type: String,
        default: undefined,
      },
      label: {
        type: String,
        required: true,
      },
    },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            'aria-label': props.tooltip ?? props.label,
            onClick: () => {
              emit('click', new MouseEvent('click'));
            },
          },
          props.label,
        );
    },
  }),
  MDFabContainer: defineComponent({
    name: 'MDFabContainerStub',
    setup(_props, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
}));

vi.mock('@shared/ui/Icon', () => ({
  MDSymbol: defineComponent({
    name: 'MDSymbolStub',
    props: {
      name: {
        type: String,
        required: true,
      },
    },
    setup(props) {
      return () => h('span', props.name);
    },
  }),
}));

vi.mock('@widget/RepositoryExplorerWidget', () => ({
  RepositoryExplorerEntryManageButton: defineComponent({
    name: 'RepositoryExplorerEntryManageButtonStub',
    props: {
      showDocumentActions: {
        type: Boolean,
        default: false,
      },
    },
    setup(props) {
      return () =>
        h(
          'button',
          {
            type: 'button',
          },
          props.showDocumentActions
            ? 'Nested directory actions'
            : 'Current directory actions: Create directory',
        );
    },
  }),
  RepositoryExplorerWidget: defineComponent({
    name: 'RepositoryExplorerWidgetStub',
    props: {
      deviceDirectoryAccessGrantDisabled: {
        type: Boolean,
        default: false,
      },
      deviceDirectoryAccessGrantLoading: {
        type: Boolean,
        default: false,
      },
      deviceDirectoryAccessMessage: {
        type: String,
        default: undefined,
      },
    },
    emits: [
      'clickPath',
      'clickReturnHome',
      'clickDocument',
      'grantDeviceDirectoryAccess',
      'cancelDeviceDirectoryAccess',
    ],
    setup(props, { slots, emit }) {
      return () =>
        h('main', [
          h(
            'button',
            {
              onClick: () => {
                emit('clickPath', '/Google Drive/My Drive');
              },
            },
            'Path',
          ),
          h(
            'button',
            {
              onClick: () => {
                emit('clickReturnHome');
              },
            },
            'Home',
          ),
          h(
            'button',
            {
              onClick: () => {
                emit('clickDocument', 'document-id');
              },
            },
            'Document',
          ),
          h(
            'button',
            {
              disabled: props.deviceDirectoryAccessGrantDisabled,
              onClick: () => {
                emit('grantDeviceDirectoryAccess');
              },
            },
            'Grant access',
          ),
          h(
            'button',
            {
              onClick: () => {
                emit('cancelDeviceDirectoryAccess');
              },
            },
            'Cancel access',
          ),
          props.deviceDirectoryAccessMessage ? h('span', props.deviceDirectoryAccessMessage) : null,
          slots.after?.(),
        ]);
    },
  }),
}));

const mountPane = async () => {
  const { default: RepoExplorerPane } = await import('./RepoExplorerPane.vue');

  return mount(RepoExplorerPane, {
    props: {
      repoPath: '/Google Drive/My Drive/Mioframe',
    },
    slots: {
      navigationButton: () => h('button', 'Back'),
      appBarTrailing: () => h('span', 'Trailing'),
    },
  });
};

describe('RepoExplorerPane', () => {
  afterEach(() => {
    canEditChildren.value = true;
    repositoryFactsError.value = undefined;
    repositoryVisibleEntriesError.value = undefined;
    getDeviceDirectoryAccessRequestMock.mockReset();
    openMock.mockReset();
    importDocumentMock.mockReset();
    resolveDeviceDirectoryAccessRequestMock.mockReset();
    document.body.innerHTML = '';
  });

  it('renders one floating Add action and opens the add sheet', async () => {
    const wrapper = await mountPane();

    expect(wrapper.text()).toContain('Current directory actions: Create directory');
    expect(wrapper.text()).toContain('Add');
    expect(wrapper.findAll('button[aria-label="Add"]')).toHaveLength(1);
    expect(wrapper.find('button[aria-label="Create directory"]').exists()).toBe(false);

    await wrapper.get('button[aria-label="Add"]').trigger('click');

    expect(wrapper.find('[data-testid="entry-add-sheet"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="directory-create-dialog"]').exists()).toBe(false);
  });

  it('shows the create-folder FAB only when the directory allows editing children', async () => {
    canEditChildren.value = false;

    const wrapper = await mountPane();

    expect(wrapper.find('button[aria-label="Add"]').exists()).toBe(false);
    expect(wrapper.find('button[aria-label="Create directory"]').exists()).toBe(false);
  });

  it('renders the current folder title and keeps dialogs hidden by default', async () => {
    const wrapper = await mountPane();

    expect(wrapper.text()).toContain('Mioframe');
    expect(wrapper.find('[data-testid="entry-add-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="document-create-dialog"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="directory-create-dialog"]').exists()).toBe(false);
  });

  it('opens the create directory dialog after selecting create directory from the add sheet', async () => {
    const wrapper = await mountPane();

    await wrapper.get('button[aria-label="Add"]').trigger('click');
    await wrapper.get('[data-testid="entry-add-sheet"] button').trigger('click');

    expect(wrapper.find('[data-testid="directory-create-dialog"]').exists()).toBe(true);
  });

  it('opens the create document dialog after selecting create document from the add sheet', async () => {
    const wrapper = await mountPane();

    await wrapper.get('button[aria-label="Add"]').trigger('click');
    await wrapper.findAll('[data-testid="entry-add-sheet"] button')[1]?.trigger('click');

    expect(wrapper.find('[data-testid="document-create-dialog"]').exists()).toBe(true);
  });

  it('delegates import from the add sheet to the shared import action', async () => {
    const wrapper = await mountPane();

    await wrapper.get('button[aria-label="Add"]').trigger('click');
    await wrapper.findAll('[data-testid="entry-add-sheet"] button')[2]?.trigger('click');

    expect(importDocumentMock).toHaveBeenCalledWith('/Google Drive/My Drive/Mioframe');
  });

  it('routes breadcrumb, home, and document selections through stack navigation', async () => {
    const wrapper = await mountPane();
    const buttons = wrapper.findAll('button');
    const pathButton = buttons.find((button) => button.text() === 'Path');
    const homeButton = buttons.find((button) => button.text() === 'Home');
    const documentButton = buttons.find((button) => button.text() === 'Document');

    if (!pathButton || !homeButton || !documentButton) {
      throw new Error('Expected repository widget action buttons');
    }

    await pathButton.trigger('click');
    await homeButton.trigger('click');
    await documentButton.trigger('click');

    expect(openMock).toHaveBeenCalledWith('repo', {
      repoPath: '/Google Drive/My Drive',
    });
    expect(openMock).toHaveBeenCalledWith('home', {}, { additionalPanes: 0, replace: true });
    expect(openMock).toHaveBeenCalledWith(
      'document',
      {
        documentDirectory: '/Google Drive/My Drive/Mioframe',
        documentId: 'document-id',
      },
      {
        target: 'document',
      },
    );
  });

  it('loads the pending access request before enabling grant access and retries the current path after permission is granted', async () => {
    const handle = createPermissionHandle('granted');
    repositoryVisibleEntriesError.value = new DeviceDirectoryAccessRequiredError({
      requestId: 'request-1',
      spaceName: 'Work',
      mode: 'readwrite',
    });
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      id: 'request-1',
      name: 'Work',
      handle,
      mode: 'readwrite',
    });

    const wrapper = await mountPane();

    await vi.waitFor(() => {
      expect(getDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith('request-1');
    });

    const grantButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Grant access');

    if (!grantButton) {
      throw new Error('Expected Grant access button');
    }

    expect(grantButton.attributes('disabled')).toBeUndefined();

    await grantButton.trigger('click');

    expect(handle.requestPermissionMock).toHaveBeenCalledWith({
      mode: 'readwrite',
    });
    expect(resolveDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith({
      id: 'request-1',
      permissionState: 'granted',
    });
    expect(openMock).toHaveBeenCalledWith(
      'repo',
      {
        repoPath: '/Google Drive/My Drive/Mioframe',
      },
      {
        replace: true,
        target: 'current',
      },
    );
  });

  it('keeps the recovery state and does not navigate when permission is denied', async () => {
    const handle = createPermissionHandle('denied');
    repositoryVisibleEntriesError.value = new DeviceDirectoryAccessRequiredError({
      requestId: 'request-2',
      spaceName: 'Work',
      mode: 'readwrite',
    });
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      id: 'request-2',
      name: 'Work',
      handle,
      mode: 'readwrite',
    });

    const wrapper = await mountPane();

    await vi.waitFor(() => {
      expect(getDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith('request-2');
    });

    const grantButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Grant access');

    if (!grantButton) {
      throw new Error('Expected Grant access button');
    }

    await grantButton.trigger('click');

    expect(resolveDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith({
      id: 'request-2',
      permissionState: 'denied',
    });
    expect(openMock).not.toHaveBeenCalledWith('repo', expect.anything(), expect.anything());
    expect(wrapper.text()).toContain(
      'Mioframe still cannot open this space because your browser did not grant permission.',
    );
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
