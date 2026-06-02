/* eslint-disable vue/one-component-per-file -- Focused widget contract test with inline stubs. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { GoogleAuthError, GoogleAuthErrorCode } from '@shared/service/google';
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
const cancelFileSystemAccessRequestMock = vi.fn();
const getFileSystemAccessRequestMock = vi.fn();
const requestFileSystemAccessMock = vi.fn();
const requestTokenMock = vi.fn();

vi.mock('@entity/fsEntry', () => ({
  useFSNodeStat: () => ({
    data: directoryStatRef,
    error: directoryStatErrorRef,
  }),
}));

vi.mock('@shared/service', () => ({
  useMainServiceClient: () => ({
    fileSystem: {
      cancelFileSystemAccessRequest: cancelFileSystemAccessRequestMock,
      getFileSystemAccessRequest: getFileSystemAccessRequestMock,
      requestFileSystemAccess: requestFileSystemAccessMock,
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
      after: ({ canEditDirectoryContents }: { canEditDirectoryContents: boolean | undefined }) =>
        h(
          'div',
          { 'data-testid': 'after-slot' },
          canEditDirectoryContents === false ? 'blocked' : 'reachable',
        ),
    },
  });
};

const mountGoogleDriveWidget = async () => {
  const { default: RepositoryExplorerWidget } = await import('./RepositoryExplorerWidget.vue');

  return mount(RepositoryExplorerWidget, {
    props: {
      directoryPath: '/Google Drive/work@example.com/My Drive',
    },
    slots: {
      after: ({ canEditDirectoryContents }: { canEditDirectoryContents: boolean | undefined }) =>
        h(
          'div',
          { 'data-testid': 'after-slot' },
          canEditDirectoryContents === false ? 'blocked' : 'reachable',
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
    cancelFileSystemAccessRequestMock.mockReset();
    getFileSystemAccessRequestMock.mockReset();
    requestFileSystemAccessMock.mockReset();
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
    expect(wrapper.get('[data-testid="after-slot"]').text()).toBe('reachable');
  });

  it('loads the pending read access request before enabling grant access and does not prompt on mount', async () => {
    repositoryRecoveryErrorsRef.value = [
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'read',
      }),
    ];

    let resolveRequest: ((value: unknown) => void) | undefined;
    getFileSystemAccessRequestMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const wrapper = await mountWidget();

    await vi.waitFor(() => {
      expect(getFileSystemAccessRequestMock).toHaveBeenCalledWith({
        operation: 'read',
        spaceName: 'Work',
      });
    });

    const grantButtonBeforeLoad = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Grant access');

    if (!grantButtonBeforeLoad || !resolveRequest) {
      throw new Error('Expected Grant access button and pending request resolver');
    }

    expect(grantButtonBeforeLoad.attributes('disabled')).toBeDefined();
    expect(requestFileSystemAccessMock).not.toHaveBeenCalled();

    resolveRequest({ spaceName: 'Work', operation: 'read' });

    await vi.waitFor(() => {
      const grantButton = wrapper
        .findAll('button')
        .find((button) => button.text() === 'Grant access');

      expect(grantButton?.attributes('disabled')).toBeUndefined();
    });
    expect(requestFileSystemAccessMock).not.toHaveBeenCalled();
  });

  it('calls requestDeviceDirectoryAccessPermission without retrying the route after grant', async () => {
    repositoryRecoveryErrorsRef.value = [
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'read',
      }),
    ];
    getFileSystemAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      operation: 'read',
    });
    requestFileSystemAccessMock.mockResolvedValue({ status: 'granted' });

    const wrapper = await mountWidget();

    await vi.waitFor(() => {
      expect(getFileSystemAccessRequestMock).toHaveBeenCalledWith({
        operation: 'read',
        spaceName: 'Work',
      });
    });

    const grantButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Grant access');

    if (!grantButton) {
      throw new Error('Expected Grant access button');
    }

    await grantButton.trigger('click');

    expect(requestFileSystemAccessMock).toHaveBeenCalledWith({
      operation: 'read',
      spaceName: 'Work',
    });
    expect(wrapper.emitted('retryCurrentPath')).toBeUndefined();
  });

  it('keeps the recovery state and safe message after denial without retrying the route', async () => {
    repositoryRecoveryErrorsRef.value = [
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'read',
      }),
    ];
    getFileSystemAccessRequestMock.mockResolvedValue({
      spaceName: 'Work',
      operation: 'read',
    });
    requestFileSystemAccessMock.mockResolvedValue({ status: 'denied' });

    const wrapper = await mountWidget();

    await vi.waitFor(() => {
      expect(getFileSystemAccessRequestMock).toHaveBeenCalledWith({
        operation: 'read',
        spaceName: 'Work',
      });
    });

    const grantButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Grant access');

    if (!grantButton) {
      throw new Error('Expected Grant access button');
    }

    await grantButton.trigger('click');

    expect(requestFileSystemAccessMock).toHaveBeenCalledWith({
      operation: 'read',
      spaceName: 'Work',
    });
    expect(wrapper.emitted('retryCurrentPath')).toBeUndefined();
    expect(wrapper.text()).toContain(
      'Mioframe still cannot open this space because your browser did not grant permission.',
    );
  });

  it('cancels the pending request before returning home', async () => {
    repositoryRecoveryErrorsRef.value = [
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'read',
      }),
    ];
    getFileSystemAccessRequestMock.mockResolvedValue(undefined);
    cancelFileSystemAccessRequestMock.mockResolvedValue(true);

    const wrapper = await mountWidget();

    const cancelButton = wrapper.findAll('button').find((button) => button.text() === 'Cancel');

    if (!cancelButton) {
      throw new Error('Expected Cancel button');
    }

    await cancelButton.trigger('click');

    expect(cancelFileSystemAccessRequestMock).toHaveBeenCalledWith({
      operation: 'read',
      spaceName: 'Work',
    });
    expect(wrapper.emitted('clickReturnHome')).toEqual([[]]);
  });

  it('does not show Google Drive recovery when the widget has no error message', async () => {
    repositoryRecoveryErrorsRef.value = [
      new GoogleAuthError({
        code: GoogleAuthErrorCode.reauthRequired,
      }),
    ];

    const wrapperWithoutMessage = await mountGoogleDriveWidget();

    expect(wrapperWithoutMessage.text()).not.toContain('Retry authorization');
  });

  it('keeps missing edit capabilities reachable for the after slot contract', async () => {
    directoryStatRef.value = {};

    const wrapper = await mountWidget();

    expect(wrapper.get('[data-testid="after-slot"]').text()).toBe('reachable');
  });

  it('does not treat write access recovery as a folder-open recovery screen', async () => {
    repositoryRecoveryErrorsRef.value = [
      new WebFileSystemAccessRequiredError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ];

    const wrapper = await mountWidget();

    expect(getFileSystemAccessRequestMock).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('Grant access');
    expect(wrapper.text()).not.toContain('Permission required');
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
