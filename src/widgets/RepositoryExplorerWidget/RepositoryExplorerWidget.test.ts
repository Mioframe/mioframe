/* eslint-disable vue/one-component-per-file -- Focused widget contract test with inline stubs. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { computed, defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import { GoogleAuthError, GoogleAuthErrorCode } from '@shared/service';

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
const requestTokenMock = vi.fn();
const importDocumentFromPathMock = vi.fn();
const grantFullAccessMock = vi.fn();
const grantReadOnlyAccessMock = vi.fn();
const isGrantLocalDirectoryAccessPendingRef = ref(false);
const isGrantLocalDirectoryAccessDisabledRef = ref(false);
const localDirectoryRecoveryMessageRef = ref('');

const createSerializedRecoveryError = ({
  mode,
  spaceName,
}: {
  mode: 'read' | 'readwrite';
  spaceName: string;
}) =>
  Object.assign(new Error('Permission required to open this remembered local space'), {
    code: 'web-file-system-access-required',
    mode,
    name: 'WebFileSystemAccessRequiredError',
    spaceName,
  });

vi.mock('@entity/fsEntry', () => ({
  useFSNodeStat: () => ({
    data: directoryStatRef,
    error: directoryStatErrorRef,
  }),
}));

vi.mock('@feature/localDirectoryRecovery', () => ({
  useLocalDirectoryRecoveryAction: () => ({
    grantFullAccess: grantFullAccessMock,
    grantReadOnlyAccess: grantReadOnlyAccessMock,
    isGrantLocalDirectoryAccessPending: computed(() => isGrantLocalDirectoryAccessPendingRef.value),
    isGrantLocalDirectoryAccessDisabled: computed(
      () => isGrantLocalDirectoryAccessDisabledRef.value,
    ),
    localDirectoryRecoveryMessage: computed(() => localDirectoryRecoveryMessageRef.value),
  }),
}));

vi.mock('@shared/service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@shared/service')>();
  return {
    ...actual,
    useMainServiceClient: () => ({
      google: {
        requestToken: requestTokenMock,
      },
    }),
  };
});

vi.mock('@feature/importDocument', () => ({
  useImportDocumentAction: () => ({
    importDocument: vi.fn(),
    importDocumentFromPath: importDocumentFromPathMock,
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
      supportingTextStatus: {
        type: Boolean,
        default: false,
      },
    },
    setup(props, { slots }) {
      return () =>
        h('section', [
          h('h2', props.headline),
          props.supportingText
            ? h(
                'p',
                props.supportingTextStatus ? { 'aria-live': 'polite', role: 'status' } : undefined,
                props.supportingText,
              )
            : null,
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

vi.mock('@shared/ui/material', () => ({
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
    emits: ['selectPath', 'selectJsonFile'],
    setup(_props, { emit }) {
      return () =>
        h('div', [
          h(
            'button',
            {
              'data-testid': 'select-path-btn',
              onClick: () => {
                emit('selectPath', '/child');
              },
            },
            'File',
          ),
          h(
            'button',
            {
              'data-testid': 'select-json-file-btn',
              onClick: () => {
                emit('selectJsonFile', '/child/doc.json');
              },
            },
            'JSON file',
          ),
        ]);
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
    requestTokenMock.mockReset();
    importDocumentFromPathMock.mockReset();
    grantFullAccessMock.mockReset();
    grantReadOnlyAccessMock.mockReset();
    isGrantLocalDirectoryAccessPendingRef.value = false;
    isGrantLocalDirectoryAccessDisabledRef.value = false;
    localDirectoryRecoveryMessageRef.value = '';
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

  it('shows read recovery without requesting permission before click', async () => {
    repositoryRecoveryErrorsRef.value = [
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'read',
      }),
    ];

    const wrapper = await mountWidget();

    const grantButtonBeforeLoad = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Grant full access');
    const readOnlyButtonBeforeLoad = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Read only');

    if (!grantButtonBeforeLoad || !readOnlyButtonBeforeLoad) {
      throw new Error('Expected local directory recovery buttons');
    }

    expect(grantButtonBeforeLoad.attributes('disabled')).toBeUndefined();
    expect(readOnlyButtonBeforeLoad.attributes('disabled')).toBeUndefined();
    expect(wrapper.text()).not.toContain('Cancel');
    expect(grantFullAccessMock).not.toHaveBeenCalled();
    expect(grantReadOnlyAccessMock).not.toHaveBeenCalled();
  });

  it('detects read recovery from the directory stat error through the generic parser', async () => {
    directoryStatErrorRef.value = createSerializedRecoveryError({
      spaceName: 'Archive',
      mode: 'read',
    });
    localDirectoryRecoveryMessageRef.value =
      'Mioframe remembers "Archive", but your browser requires permission before opening it.';

    const wrapper = await mountWidget();

    expect(wrapper.text()).toContain('Permission required');
    expect(wrapper.text()).toContain(
      'Mioframe remembers "Archive", but your browser requires permission before opening it.',
    );
    expect(
      wrapper.findAll('button').filter((button) => button.text() === 'Grant full access'),
    ).toHaveLength(1);
    expect(
      wrapper.findAll('button').filter((button) => button.text() === 'Read only'),
    ).toHaveLength(1);
  });

  it('calls the feature read-only recovery action without retrying the route after grant', async () => {
    repositoryRecoveryErrorsRef.value = [
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'read',
      }),
    ];
    grantReadOnlyAccessMock.mockResolvedValue({ status: 'granted' });

    const wrapper = await mountWidget();

    const grantButton = wrapper.findAll('button').find((button) => button.text() === 'Read only');

    if (!grantButton) {
      throw new Error('Expected Read only button');
    }

    await grantButton.trigger('click');

    expect(grantReadOnlyAccessMock).toHaveBeenCalledWith();
    expect(wrapper.emitted('retryCurrentPath')).toBeUndefined();
  });

  it('calls the feature full-access recovery action without retrying the route after grant', async () => {
    repositoryRecoveryErrorsRef.value = [
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'read',
      }),
    ];
    grantFullAccessMock.mockResolvedValue({ status: 'granted' });

    const wrapper = await mountWidget();

    const grantButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Grant full access');

    if (!grantButton) {
      throw new Error('Expected Grant full access button');
    }

    await grantButton.trigger('click');

    expect(grantFullAccessMock).toHaveBeenCalledWith();
    expect(wrapper.emitted('retryCurrentPath')).toBeUndefined();
  });

  it('renders the feature-provided recovery message', async () => {
    repositoryRecoveryErrorsRef.value = [
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'read',
      }),
    ];
    localDirectoryRecoveryMessageRef.value =
      'Could not request browser permission. Try again from this action.';

    const wrapper = await mountWidget();

    expect(wrapper.text()).toContain(
      'Could not request browser permission. Try again from this action.',
    );
  });

  it('announces local-directory pending copy while both recovery actions are disabled', async () => {
    repositoryRecoveryErrorsRef.value = [
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'read',
      }),
    ];
    isGrantLocalDirectoryAccessDisabledRef.value = true;
    isGrantLocalDirectoryAccessPendingRef.value = true;
    localDirectoryRecoveryMessageRef.value =
      'Waiting for browser permission. If access is granted, Mioframe will restore this space.';

    const wrapper = await mountWidget();
    const pendingStatus = wrapper.get('[role="status"]');
    const recoveryButtons = wrapper
      .findAll('button')
      .filter((button) => ['Read only', 'Grant full access'].includes(button.text()));

    expect(recoveryButtons).toHaveLength(2);
    expect(recoveryButtons.every((button) => button.attributes('disabled') !== undefined)).toBe(
      true,
    );
    expect(pendingStatus.attributes('aria-live')).toBe('polite');
    expect(pendingStatus.text()).toBe(
      'Waiting for browser permission. If access is granted, Mioframe will restore this space.',
    );
  });

  it('does not infer local-directory pending status from disabled action availability', async () => {
    repositoryRecoveryErrorsRef.value = [
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'read',
      }),
    ];
    isGrantLocalDirectoryAccessDisabledRef.value = true;
    isGrantLocalDirectoryAccessPendingRef.value = false;
    localDirectoryRecoveryMessageRef.value =
      'Mioframe remembers "Work", but your browser requires permission before opening it.';

    const wrapper = await mountWidget();
    const recoveryButtons = wrapper
      .findAll('button')
      .filter((button) => ['Read only', 'Grant full access'].includes(button.text()));

    expect(recoveryButtons.every((button) => button.attributes('disabled') !== undefined)).toBe(
      true,
    );
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
  });

  it('disables Google reauthorization and announces provider-window pending copy', async () => {
    errorMessageRef.value = 'Authorization required';
    repositoryRecoveryErrorsRef.value = [
      new GoogleAuthError({
        code: GoogleAuthErrorCode.reauthRequired,
        expectedEmail: 'work@example.com',
      }),
    ];
    let resolveRequest: (() => void) | undefined;
    requestTokenMock.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveRequest = resolve;
        }),
    );

    const wrapper = await mountGoogleDriveWidget();
    const retryButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Retry authorization');

    await retryButton?.trigger('click');

    expect(retryButton?.attributes('disabled')).toBeDefined();
    expect(wrapper.get('[role="status"]').attributes('aria-live')).toBe('polite');
    expect(wrapper.get('[role="status"]').text()).toBe(
      'Complete authorization in the provider window.',
    );

    await retryButton?.trigger('click');
    expect(requestTokenMock).toHaveBeenCalledTimes(1);

    resolveRequest?.();
    await vi.dynamicImportSettled();

    expect(retryButton?.attributes('disabled')).toBeUndefined();
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
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
      createSerializedRecoveryError({
        spaceName: 'Work',
        mode: 'readwrite',
      }),
    ];

    const wrapper = await mountWidget();

    expect(grantFullAccessMock).not.toHaveBeenCalled();
    expect(grantReadOnlyAccessMock).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain('Grant full access');
    expect(wrapper.text()).not.toContain('Read only');
    expect(wrapper.text()).not.toContain('Permission required');
  });

  it('calls importDocumentFromPath with the current directory path when a JSON file is selected', async () => {
    importDocumentFromPathMock.mockResolvedValue(undefined);

    const wrapper = await mountWidget();

    const jsonFileButton = wrapper.get('[data-testid="select-json-file-btn"]');
    await jsonFileButton.trigger('click');

    expect(importDocumentFromPathMock).toHaveBeenCalledWith(
      '/Device Files/Work',
      '/child/doc.json',
    );
    expect(wrapper.emitted('clickPath')).toBeUndefined();
  });

  it('does not emit clickPath when a JSON file is selected', async () => {
    importDocumentFromPathMock.mockResolvedValue(undefined);

    const wrapper = await mountWidget();

    await wrapper.get('[data-testid="select-json-file-btn"]').trigger('click');

    expect(wrapper.emitted('clickPath')).toBeUndefined();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
