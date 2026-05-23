/* eslint-disable vue/one-component-per-file -- This test file intentionally defines inline stubs and a small harness component. */
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

const {
  importDocumentMock,
  removeMock,
  selectedLabel,
  isDirectoryEntry,
  canEditChildren,
  canChangePath,
  canDelete,
  renderedLabels,
} = vi.hoisted(() => ({
  importDocumentMock: vi.fn(),
  removeMock: vi.fn(),
  selectedLabel: { value: 'Import JSON' },
  isDirectoryEntry: { value: true },
  canEditChildren: { value: true },
  canChangePath: { value: true },
  canDelete: { value: true },
  renderedLabels: { value: new Array<string>() },
}));

vi.mock('@entity/directory/useDirectory', () => ({
  useDirectory: () => ({
    data: ref([
      [
        'target',
        {
          type: isDirectoryEntry.value ? 2 : 1,
        },
      ],
    ]),
  }),
}));

vi.mock('@entity/fsEntry', () => ({
  useFSNodeStat: () => ({
    data: ref({
      capabilities: {
        canChangePath: canChangePath.value,
        canDelete: canDelete.value,
        canEditChildren: canEditChildren.value,
      },
    }),
  }),
}));

vi.mock('@feature/directoryCreate', () => ({
  DirectoryCreateDialog: defineComponent({
    name: 'DirectoryCreateDialogStub',
    setup() {
      return () => h('div', { 'data-testid': 'create-directory-dialog' });
    },
  }),
}));

vi.mock('@feature/documentCreate', () => ({
  DocumentCreationDialog: defineComponent({
    name: 'DocumentCreationDialogStub',
    setup() {
      return () => h('div', { 'data-testid': 'create-document-dialog' });
    },
  }),
}));

vi.mock('@feature/entryRemove', () => ({
  useRemoveFSEntry: () => ({
    remove: removeMock,
  }),
}));

vi.mock('@feature/entryRename', () => ({
  FSEntryRenameDialog: defineComponent({
    name: 'FSEntryRenameDialogStub',
    setup() {
      return () => h('div', { 'data-testid': 'rename-entry-dialog' });
    },
  }),
}));

vi.mock('@feature/importDocument', () => ({
  useImportDocumentAction: () => ({
    importDocument: importDocumentMock,
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
      return () => {
        renderedLabels.value = props.btns
          .filter(
            (button): button is { label: string } => typeof button === 'object' && button !== null,
          )
          .map((button) => button.label);

        return h(
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
                    button.label === selectedLabel.value,
                ) ?? props.btns[0],
              );
            },
          },
          props.tooltip,
        );
      };
    },
  }),
  defineMenuButtonList: <T>(buttons: T[]) => buttons,
}));

vi.mock('@shared/ui/Menu/defineMenuButtonList', () => ({
  defineMenuButton: <T extends object>(button: T) => button,
}));

describe('FSEntryManageMenuButton', () => {
  beforeEach(() => {
    importDocumentMock.mockReset();
    removeMock.mockReset();
    selectedLabel.value = 'Import JSON';
    isDirectoryEntry.value = true;
    canEditChildren.value = true;
    canChangePath.value = true;
    canDelete.value = true;
    renderedLabels.value = [];
  });

  const mountButton = async (props?: { showDocumentActions?: boolean }) => {
    const { default: FSEntryManageMenuButton } = await import('./FSEntryManageMenuButton.vue');

    return mount(FSEntryManageMenuButton, {
      props: {
        path: '/target',
        ...props,
      },
    });
  };

  it('renders document actions only when legacy document actions are enabled for a directory', async () => {
    await mountButton({ showDocumentActions: true });

    expect(renderedLabels.value).toEqual([
      'Create directory',
      'Create document',
      'Rename',
      'Import JSON',
      'Remove',
    ]);
  });

  it('keeps directory actions separate from document actions on the split-folder screen', async () => {
    await mountButton();

    expect(renderedLabels.value).toEqual(['Create directory', 'Rename', 'Remove']);
  });

  it('uses file-only actions for regular files', async () => {
    isDirectoryEntry.value = false;

    await mountButton();

    expect(renderedLabels.value).toEqual(['Rename', 'Remove']);
  });

  it('keeps dialogs closed by default and exposes the entry-specific menu tooltip', async () => {
    const wrapper = await mountButton();

    expect(wrapper.text()).toContain('options target');
    expect(wrapper.find('[data-testid="create-directory-dialog"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="create-document-dialog"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="rename-entry-dialog"]').exists()).toBe(false);
  });

  it('opens the create-directory dialog for directory actions', async () => {
    selectedLabel.value = 'Create directory';

    const wrapper = await mountButton();

    await wrapper.get('button').trigger('click');

    expect(wrapper.find('[data-testid="create-directory-dialog"]').exists()).toBe(true);
  });

  it('opens the create-document dialog for legacy directory document actions', async () => {
    selectedLabel.value = 'Create document';

    const wrapper = await mountButton({ showDocumentActions: true });

    await wrapper.get('button').trigger('click');

    expect(wrapper.find('[data-testid="create-document-dialog"]').exists()).toBe(true);
  });

  it('opens the rename dialog when rename is selected', async () => {
    selectedLabel.value = 'Rename';

    const wrapper = await mountButton();

    await wrapper.get('button').trigger('click');

    expect(wrapper.find('[data-testid="rename-entry-dialog"]').exists()).toBe(true);
  });

  it('calls remove for delete actions', async () => {
    selectedLabel.value = 'Remove';

    const wrapper = await mountButton();

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(removeMock).toHaveBeenCalledWith('/target');
  });

  it('delegates directory import actions to the shared import feature action', async () => {
    selectedLabel.value = 'Import JSON';

    const wrapper = await mountButton({ showDocumentActions: true });

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(importDocumentMock).toHaveBeenCalledWith('/target');
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline test stubs used in this file. */
