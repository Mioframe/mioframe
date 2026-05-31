/* eslint-disable vue/one-component-per-file -- Focused widget contract test with inline stubs. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { WebFileSystemAccessRequiredError } from '@shared/lib/webFileSystemProvider';

const directoryStatRef = ref<{
  capabilities?: {
    canEditChildren?: boolean;
  };
}>({
  capabilities: {
    canEditChildren: true,
  },
});
const directoryStatErrorRef = ref<unknown>();
const documentIdsRef = ref<string[] | undefined>([]);
const errorMessageRef = ref<string | undefined>();
const hideAutomergeFilesRef = ref(true);
const isLoadingRef = ref(false);
const isRepositoryInitializedRef = ref(false);
const regularFileEntriesRef = ref<unknown[] | undefined>([]);
const repositoryRecoveryErrorsRef = ref<unknown[]>([]);
const getDeviceDirectoryAccessRequestMock = vi.fn();
const resolveDeviceDirectoryAccessRequestMock = vi.fn();
const requestTokenMock = vi.fn();

type MockPermissionDirectoryHandle = FileSystemDirectoryHandle & {
  requestPermissionMock: ReturnType<
    typeof vi.fn<(descriptor?: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>>
  >;
};

const createPermissionHandle = (
  permissionState: PermissionState,
): MockPermissionDirectoryHandle => {
  const requestPermissionMock = vi.fn(() => Promise.resolve(permissionState));

  return {
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
};

vi.mock('@entity/fsEntry', () => ({
  useFSNodeStat: () => ({
    data: directoryStatRef,
    error: directoryStatErrorRef,
  }),
}));

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      getDeviceDirectoryAccessRequest: getDeviceDirectoryAccessRequestMock,
      resolveDeviceDirectoryAccessRequest: resolveDeviceDirectoryAccessRequestMock,
    },
    google: {
      requestToken: requestTokenMock,
    },
  }),
}));

vi.mock('./useRepositoryExplorerDirectoryState', () => ({
  useRepositoryExplorerDirectoryState: () => ({
    documentIds: documentIdsRef,
    errorMessage: errorMessageRef,
    hideAutomergeFiles: hideAutomergeFilesRef,
    isLoading: isLoadingRef,
    isRepositoryInitialized: isRepositoryInitializedRef,
    recoveryErrors: computed(() => repositoryRecoveryErrorsRef.value),
    regularFileEntries: regularFileEntriesRef,
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

vi.mock('@shared/ui/NavigationPath', () => ({
  MDNavigationPath: defineComponent({
    name: 'MDNavigationPathStub',
    emits: ['click', 'clickHome'],
    setup(_props, { emit }) {
      return () =>
        h('div', [
          h(
            'button',
            {
              onClick: () => {
                emit('click', '/parent');
              },
            },
            'Path',
          ),
          h(
            'button',
            {
              onClick: () => {
                emit('clickHome');
              },
            },
            'Home',
          ),
        ]);
    },
  }),
}));

vi.mock('@shared/ui/EmptyState', () => ({
  MDEmptyState: defineComponent({
    name: 'MDEmptyStateStub',
    props: {
      headline: {
        type: String,
        required: true,
      },
      supportingText: {
        type: String,
        default: undefined,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('section', [
          h('h2', props.headline),
          props.supportingText ? h('p', props.supportingText) : null,
          slots.icon?.(),
          slots.actions?.(),
        ]);
    },
  }),
}));

vi.mock('@shared/ui/ProgressIndicators', () => ({
  MDCircularProgressIndicator: defineComponent({
    name: 'MDCircularProgressIndicatorStub',
    setup() {
      return () => h('div', 'Loading');
    },
  }),
}));

vi.mock('@shared/ui/Button', () => ({
  MDButton: defineComponent({
    name: 'MDButtonStub',
    props: {
      disabled: {
        type: Boolean,
        default: false,
      },
      label: {
        type: String,
        required: true,
      },
      loading: {
        type: Boolean,
        default: false,
      },
    },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            disabled: props.disabled,
            type: 'button',
            onClick: () => {
              emit('click');
            },
          },
          props.label,
        );
    },
  }),
}));

vi.mock('./RepositoryExplorerDocumentsSection.vue', () => ({
  default: defineComponent({
    name: 'RepositoryExplorerDocumentsSectionStub',
    emits: ['selectDocument'],
    setup(_props, { emit }) {
      return () =>
        h(
          'button',
          {
            onClick: () => {
              emit('selectDocument', 'document-id');
            },
          },
          'Document',
        );
    },
  }),
}));

vi.mock('./RepositoryExplorerFilesSection.vue', () => ({
  default: defineComponent({
    name: 'RepositoryExplorerFilesSectionStub',
    emits: ['selectPath'],
    setup(_props, { emit }) {
      return () =>
        h(
          'button',
          {
            onClick: () => {
              emit('selectPath', '/child');
            },
          },
          'File',
        );
    },
  }),
}));

const mountWidget = async () => {
  const { default: RepositoryExplorerWidget } = await import('./RepositoryExplorerWidget.vue');

  return mount(RepositoryExplorerWidget, {
    props: {
      directoryPath: '/Device Files/Work',
    },
    slots: {
      after: ({ canEditDirectoryContents }: { canEditDirectoryContents: boolean }) =>
        h(
          'div',
          { 'data-testid': 'after-slot' },
          canEditDirectoryContents ? 'editable' : 'readonly',
        ),
    },
  });
};

describe('RepositoryExplorerWidget', () => {
  afterEach(() => {
    directoryStatRef.value = {
      capabilities: {
        canEditChildren: true,
      },
    };
    directoryStatErrorRef.value = undefined;
    documentIdsRef.value = [];
    errorMessageRef.value = undefined;
    hideAutomergeFilesRef.value = true;
    isLoadingRef.value = false;
    isRepositoryInitializedRef.value = false;
    regularFileEntriesRef.value = [];
    repositoryRecoveryErrorsRef.value = [];
    getDeviceDirectoryAccessRequestMock.mockReset();
    resolveDeviceDirectoryAccessRequestMock.mockReset();
    requestTokenMock.mockReset();
    document.body.innerHTML = '';
  });

  it('emits narrow navigation and document events and exposes editability through the after slot', async () => {
    const wrapper = await mountWidget();

    await wrapper.get('button').trigger('click');
    await wrapper.findAll('button')[1]?.trigger('click');
    await wrapper.findAll('button')[2]?.trigger('click');
    await wrapper.findAll('button')[3]?.trigger('click');

    expect(wrapper.emitted('clickPath')).toEqual([['/parent'], ['/child']]);
    expect(wrapper.emitted('clickReturnHome')).toEqual([[]]);
    expect(wrapper.emitted('clickDocument')).toEqual([['document-id']]);
    expect(wrapper.get('[data-testid="after-slot"]').text()).toBe('editable');
  });

  it('loads the pending access request before enabling grant access and does not prompt on mount', async () => {
    const handle = createPermissionHandle('granted');
    repositoryRecoveryErrorsRef.value = [
      new WebFileSystemAccessRequiredError({
        requestId: 'request-1',
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ];

    let resolveRequest: ((value: unknown) => void) | undefined;
    getDeviceDirectoryAccessRequestMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const wrapper = await mountWidget();

    await vi.waitFor(() => {
      expect(getDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith('request-1');
    });

    const grantButtonBeforeLoad = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Grant access');

    if (!grantButtonBeforeLoad || !resolveRequest) {
      throw new Error('Expected Grant access button and pending request resolver');
    }

    expect(grantButtonBeforeLoad.attributes('disabled')).toBeDefined();
    expect(handle.requestPermissionMock).not.toHaveBeenCalled();

    resolveRequest({
      id: 'request-1',
      name: 'Work',
      handle,
      mode: 'readwrite',
    });

    await vi.waitFor(() => {
      const grantButton = wrapper
        .findAll('button')
        .find((button) => button.text() === 'Grant access');

      expect(grantButton?.attributes('disabled')).toBeUndefined();
    });
    expect(handle.requestPermissionMock).not.toHaveBeenCalled();
  });

  it('requests permission from the loaded handle and emits retryCurrentPath after grant', async () => {
    const handle = createPermissionHandle('granted');
    repositoryRecoveryErrorsRef.value = [
      new WebFileSystemAccessRequiredError({
        requestId: 'request-2',
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ];
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      id: 'request-2',
      name: 'Work',
      handle,
      mode: 'readwrite',
    });
    resolveDeviceDirectoryAccessRequestMock.mockResolvedValue({
      request: {
        id: 'request-2',
        name: 'Work',
        handle,
        mode: 'readwrite',
      },
      status: 'granted',
    });

    const wrapper = await mountWidget();

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

    expect(handle.requestPermissionMock).toHaveBeenCalledWith({
      mode: 'readwrite',
    });
    expect(resolveDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith({
      id: 'request-2',
      permissionState: 'granted',
    });
    expect(wrapper.emitted('retryCurrentPath')).toEqual([[]]);
  });

  it('keeps the recovery state and safe message after denial without retrying the route', async () => {
    const handle = createPermissionHandle('denied');
    repositoryRecoveryErrorsRef.value = [
      new WebFileSystemAccessRequiredError({
        requestId: 'request-3',
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ];
    getDeviceDirectoryAccessRequestMock.mockResolvedValue({
      id: 'request-3',
      name: 'Work',
      handle,
      mode: 'readwrite',
    });
    resolveDeviceDirectoryAccessRequestMock.mockResolvedValue({
      request: {
        id: 'request-3',
        name: 'Work',
        handle,
        mode: 'readwrite',
      },
      status: 'denied',
    });

    const wrapper = await mountWidget();

    await vi.waitFor(() => {
      expect(getDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith('request-3');
    });

    const grantButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Grant access');

    if (!grantButton) {
      throw new Error('Expected Grant access button');
    }

    await grantButton.trigger('click');

    expect(resolveDeviceDirectoryAccessRequestMock).toHaveBeenCalledWith({
      id: 'request-3',
      permissionState: 'denied',
    });
    expect(wrapper.emitted('retryCurrentPath')).toBeUndefined();
    expect(wrapper.text()).toContain(
      'Mioframe still cannot open this space because your browser did not grant permission.',
    );
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
