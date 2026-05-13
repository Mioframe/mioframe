/* eslint-disable vue/one-component-per-file -- This test file intentionally defines inline stubs and a small harness component. */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

const importJsonFileMock = vi.fn();
const reportHandledErrorMock = vi.fn();
const addSnackbarMock = vi.fn();

vi.mock('@entity/directory/useDirectory', () => ({
  useDirectory: () => ({
    data: ref([['target', { type: 2 }]]),
  }),
}));

vi.mock('@entity/fsEntry', () => ({
  useFSNodeStat: () => ({
    data: ref({
      capabilities: {
        canChangePath: true,
        canDelete: true,
        canEditChildren: true,
      },
    }),
  }),
}));

vi.mock('@feature/directoryCreate', () => ({
  DirectoryCreateDialog: defineComponent({
    name: 'DirectoryCreateDialogStub',
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('@feature/documentCreate', () => ({
  DocumentCreationDialog: defineComponent({
    name: 'DocumentCreationDialogStub',
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('@feature/entryRemove', () => ({
  useRemoveFSEntry: () => ({
    remove: vi.fn(),
  }),
}));

vi.mock('@feature/entryRename', () => ({
  FSEntryRenameDialog: defineComponent({
    name: 'FSEntryRenameDialogStub',
    setup() {
      return () => null;
    },
  }),
}));

vi.mock('@feature/importDocument', async () => {
  const actual =
    await vi.importActual<typeof import('@feature/importDocument')>('@feature/importDocument');

  return {
    ...actual,
    useImportDocument: () => ({
      importJsonFile: importJsonFileMock,
    }),
  };
});

vi.mock('@shared/lib/reportHandledError', () => ({
  reportHandledError: reportHandledErrorMock,
}));

vi.mock('@shared/ui/Snackbar', () => ({
  useSnackbar: () => ({
    addSnackbar: addSnackbarMock,
  }),
}));

vi.mock('@shared/ui/Menu', () => ({
  MDContextMenuButton: defineComponent({
    name: 'MDContextMenuButtonStub',
    props: {
      btns: {
        type: Array,
        required: true,
      },
      tooltip: {
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
            onClick: () => {
              emit(
                'click',
                props.btns.find(
                  (button) =>
                    typeof button === 'object' &&
                    button !== null &&
                    'label' in button &&
                    button.label === 'Import JSON',
                ) ?? props.btns[0],
              );
            },
          },
          props.tooltip,
        );
    },
  }),
  defineMenuButtonList: <T>(buttons: T[]) => buttons,
}));

vi.mock('@shared/ui/Menu/defineMenuButtonList', () => ({
  defineMenuButton: <T extends object>(button: T) => button,
}));

describe('FSEntryManageMenuButton', () => {
  beforeEach(() => {
    importJsonFileMock.mockReset();
    reportHandledErrorMock.mockReset();
    addSnackbarMock.mockReset();
  });

  it('does not report invalid Beaver document format import errors', async () => {
    const { DomainError } = await import('@shared/lib/error');
    const { ImportDocumentErrorCode } = await import('@feature/importDocument');
    const { default: FSEntryManageMenuButton } = await import('./FSEntryManageMenuButton.vue');

    importJsonFileMock.mockRejectedValue(
      new DomainError('Invalid Beaver document', {
        cause: new Error('zod details'),
        code: ImportDocumentErrorCode.invalidDocumentFormat,
      }),
    );

    const wrapper = mount(FSEntryManageMenuButton, {
      props: {
        path: '/target',
      },
    });

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(reportHandledErrorMock).not.toHaveBeenCalled();
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Invalid Beaver document',
    });
  });

  it('still reports unexpected import errors', async () => {
    const { default: FSEntryManageMenuButton } = await import('./FSEntryManageMenuButton.vue');
    const error = new Error('unexpected failure');

    importJsonFileMock.mockRejectedValue(error);

    const wrapper = mount(FSEntryManageMenuButton, {
      props: {
        path: '/target',
      },
    });

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(reportHandledErrorMock).toHaveBeenCalledWith(error, {
      action: 'importDocumentJson',
      feature: 'documentImport',
    });
    expect(addSnackbarMock).toHaveBeenCalledWith({
      text: 'Could not import the document',
    });
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline test stubs used in this file. */
