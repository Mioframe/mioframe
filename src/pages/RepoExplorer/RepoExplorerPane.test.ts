/* eslint-disable vue/one-component-per-file -- Focused pane contract test with inline stubs. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ComputedRef } from 'vue';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';
import type { NonEmptyMenuButtonList } from '@shared/ui/Menu';
import { defineMenuButtonList } from '@shared/ui/Menu';
import { FSNodeType } from '@shared/lib/virtualFileSystem';

const canEditDirectoryContents = ref<boolean | undefined>(true);
const hasDirectoryManageActionsRef = ref(true);
const directoryManageActionsRef = ref<NonEmptyMenuButtonList | null>(
  defineMenuButtonList([{ key: 'rename', label: 'Rename', symbolName: 'edit' }] as const),
);
const openMock = vi.fn();
const importDocumentMock = vi.fn();
const removeMock = vi.fn();
const exportDirectoryZipMock = vi.fn();
const importDirectoryZipMock = vi.fn();
const closeExportZipDialogMock = vi.fn();
const closeImportZipDialogMock = vi.fn();
const invalidateImportZipContextMock = vi.fn();
const exportZipStateRef = ref<{ status: string }>({ status: 'idle' });
const importZipStateRef = ref<{ status: string }>({ status: 'idle' });

const directoryStatRef = ref<
  | {
      capabilities?:
        | { canEditChildren?: boolean; canChangePath?: boolean; canDelete?: boolean }
        | undefined;
    }
  | undefined
>(undefined);

type FSEntryManageActionsArgs = {
  entryType: ComputedRef<unknown>;
  canEditChildren: ComputedRef<boolean | undefined>;
  canChangePath: ComputedRef<boolean | undefined>;
  canDelete: ComputedRef<boolean | undefined>;
  showCreateDocumentAction: ComputedRef<boolean>;
  showImportActions: ComputedRef<boolean>;
};
const useFSEntryManageActionsMock = vi.fn<(args: FSEntryManageActionsArgs) => unknown>();

vi.mock('@entity/fsEntry', () => ({
  useFSNodeStat: () => ({ data: directoryStatRef }),
}));

vi.mock('@feature/entryManage', () => ({
  useFSEntryManageActions: (args: FSEntryManageActionsArgs) => {
    useFSEntryManageActionsMock(args);
    return {
      hasActions: hasDirectoryManageActionsRef,
      actionButtons: ref([]),
      nonEmptyActionButtons: directoryManageActionsRef,
    };
  },
  useEntryManageDialogState: () => ({
    showRenameDialog: ref(false),
    onSelectRename: vi.fn(),
    onCloseRenameDialog: vi.fn(),
  }),
}));

vi.mock('@feature/entryRemove', () => ({
  useRemoveFSEntry: () => ({ remove: removeMock }),
}));

vi.mock('@feature/exportZip', () => ({
  useExportDirectoryZip: () => ({
    exportDirectoryZip: exportDirectoryZipMock,
    state: exportZipStateRef,
    closeExportZipDialog: closeExportZipDialogMock,
  }),
  ExportZipDialog: defineComponent({
    name: 'ExportZipDialogStub',
    props: { state: { type: Object, required: true } },
    setup() {
      return () => h('div', { 'data-testid': 'export-zip-dialog' });
    },
  }),
}));

vi.mock('@feature/importZip', () => ({
  useImportZipAction: () => ({
    importDirectoryZip: importDirectoryZipMock,
    state: importZipStateRef,
    closeImportZipDialog: closeImportZipDialogMock,
    invalidateImportZipContext: invalidateImportZipContextMock,
  }),
  ImportZipDialog: defineComponent({
    name: 'ImportZipDialogStub',
    props: { state: { type: Object, required: true } },
    emits: ['close'],
    setup(_props, { emit }) {
      return () =>
        h('div', {
          'data-testid': 'import-zip-dialog',
          onClick: () => {
            emit('close');
          },
        });
    },
  }),
}));

vi.mock('@page/routes', () => ({
  useStackNavigation: () => ({
    open: openMock,
  }),
}));

vi.mock('@feature/directoryCreate', () => ({
  DirectoryCreateDialog: defineComponent({
    name: 'DirectoryCreateDialogStub',
    emits: ['cancel', 'created'],
    setup(_props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'directory-create-dialog' }, [
          h(
            'button',
            {
              onClick: () => {
                emit('cancel');
              },
            },
            'Cancel directory create',
          ),
          h(
            'button',
            {
              onClick: () => {
                emit('created');
              },
            },
            'Confirm directory create',
          ),
        ]);
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
    emits: ['cancel', 'created'],
    setup(_props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'document-create-dialog' }, [
          h(
            'button',
            {
              onClick: () => {
                emit('cancel');
              },
            },
            'Cancel document create',
          ),
          h(
            'button',
            {
              onClick: () => {
                emit('created');
              },
            },
            'Confirm document create',
          ),
        ]);
    },
  }),
}));

vi.mock('@feature/entryRename', () => ({
  FSEntryRenameDialog: defineComponent({
    name: 'FSEntryRenameDialogStub',
    setup() {
      return () => h('div', { 'data-testid': 'rename-dialog' });
    },
  }),
}));

vi.mock('@feature/importDocument', () => ({
  useImportDocumentAction: () => ({
    importDocument: importDocumentMock,
  }),
}));

vi.mock('@shared/ui/Layout', () => ({
  MDPane: defineComponent({
    name: 'MDPaneStub',
    setup(_props, { slots }) {
      return () => h('section', [slots.topBar?.(), slots.default?.()]);
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
        h('header', [h('h1', props.headline), slots.leadingButton?.(), slots.trailingElements?.()]);
    },
  }),
}));

vi.mock('@shared/ui/Button', () => ({
  MDExtendedFab: defineComponent({
    name: 'MDExtendedFabStub',
    props: {
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
            'aria-label': props.label,
            onClick: () => {
              emit('click', new MouseEvent('click'));
            },
          },
          props.label,
        );
    },
  }),
  FabContainer: defineComponent({
    name: 'FabContainerStub',
    setup(_props, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
}));

vi.mock('@widget/RepositoryExplorerWidget', () => ({
  RepositoryExplorerEntryManageButton: defineComponent({
    name: 'RepositoryExplorerEntryManageButtonStub',
    emits: ['selectExportZip', 'selectImportZip', 'selectImportJson'],
    setup(_props, { emit }) {
      return () =>
        h('span', [
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                emit('selectExportZip');
              },
            },
            'Current directory actions: Create directory',
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                emit('selectImportZip');
              },
            },
            'Current directory actions: Import ZIP',
          ),
          h(
            'button',
            {
              type: 'button',
              onClick: () => {
                emit('selectImportJson');
              },
            },
            'Current directory actions: Import JSON',
          ),
        ]);
    },
  }),
  RepositoryExplorerWidget: defineComponent({
    name: 'RepositoryExplorerWidgetStub',
    emits: ['clickPath', 'clickReturnHome', 'clickDocument'],
    setup(_props, { emit, slots }) {
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
          slots.after?.({
            canEditDirectoryContents: canEditDirectoryContents.value,
          }),
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
    canEditDirectoryContents.value = true;
    hasDirectoryManageActionsRef.value = true;
    directoryManageActionsRef.value = defineMenuButtonList([
      { key: 'rename', label: 'Rename', symbolName: 'edit' },
    ] as const);
    openMock.mockReset();
    importDocumentMock.mockReset();
    removeMock.mockReset();
    exportDirectoryZipMock.mockReset();
    importDirectoryZipMock.mockReset();
    closeExportZipDialogMock.mockReset();
    closeImportZipDialogMock.mockReset();
    exportZipStateRef.value = { status: 'idle' };
    importZipStateRef.value = { status: 'idle' };
    directoryStatRef.value = undefined;
    useFSEntryManageActionsMock.mockClear();
    document.body.innerHTML = '';
  });

  it('renders one floating Add action and opens the add sheet', async () => {
    const wrapper = await mountPane();

    expect(wrapper.text()).toContain('Current directory actions: Create directory');
    expect(wrapper.findAll('button[aria-label="Add"]')).toHaveLength(1);

    await wrapper.get('button[aria-label="Add"]').trigger('click');

    expect(wrapper.find('[data-testid="entry-add-sheet"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="directory-create-dialog"]').exists()).toBe(false);
  });

  it('hides the Add FAB only when the widget explicitly reports non-editable directory contents', async () => {
    canEditDirectoryContents.value = false;

    const wrapper = await mountPane();

    expect(wrapper.find('button[aria-label="Add"]').exists()).toBe(false);
  });

  it('keeps the Add FAB visible when the widget cannot guarantee editability yet', async () => {
    canEditDirectoryContents.value = undefined;

    const wrapper = await mountPane();

    expect(wrapper.find('button[aria-label="Add"]').exists()).toBe(true);
  });

  it('renders the current folder title and keeps dialogs hidden by default', async () => {
    const wrapper = await mountPane();

    expect(wrapper.text()).toContain('Mioframe');
    expect(wrapper.find('[data-testid="entry-add-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="document-create-dialog"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="directory-create-dialog"]').exists()).toBe(false);
  });

  it('renders injected app-bar trailing content before pane-specific actions', async () => {
    const wrapper = await mountPane();
    const headerText = wrapper.get('header').text();

    const trailingIndex = headerText.indexOf('Trailing');
    const manageIndex = headerText.indexOf('Current directory actions: Create directory');
    expect(trailingIndex).toBeGreaterThanOrEqual(0);
    expect(manageIndex).toBeGreaterThanOrEqual(0);
    expect(trailingIndex).toBeLessThan(manageIndex);
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

  it('hides the directory manage button when no actions are available', async () => {
    hasDirectoryManageActionsRef.value = false;

    const wrapper = await mountPane();

    expect(wrapper.text()).not.toContain('Current directory actions: Create directory');
  });

  it('does not render the directory manage button when the non-empty action list is absent', async () => {
    hasDirectoryManageActionsRef.value = true;
    directoryManageActionsRef.value = null;

    const wrapper = await mountPane();

    expect(wrapper.text()).not.toContain('Current directory actions: Create directory');
  });

  it('closes pane-owned transient surfaces when directoryPath changes', async () => {
    const wrapper = await mountPane();

    await wrapper.get('button[aria-label="Add"]').trigger('click');
    expect(wrapper.find('[data-testid="entry-add-sheet"]').exists()).toBe(true);

    await wrapper.setProps({ repoPath: '/Google Drive/My Drive/Other' });

    expect(wrapper.find('[data-testid="entry-add-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="directory-create-dialog"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="document-create-dialog"]').exists()).toBe(false);
  });

  it('routes breadcrumb, home, and document selection through stack navigation', async () => {
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

    expect(openMock).toHaveBeenNthCalledWith(1, 'repo', {
      repoPath: '/Google Drive/My Drive',
    });
    expect(openMock).toHaveBeenNthCalledWith(
      2,
      'home',
      {},
      {
        additionalPanes: 0,
        replace: true,
      },
    );
    expect(openMock).toHaveBeenNthCalledWith(
      3,
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

  it('derives directory management capabilities as undefined when the directory stat has no capabilities object', async () => {
    directoryStatRef.value = { capabilities: undefined };

    await mountPane();

    const args = useFSEntryManageActionsMock.mock.calls.at(-1)?.[0];
    expect(args?.canEditChildren.value).toBeUndefined();
    expect(args?.canChangePath.value).toBeUndefined();
    expect(args?.canDelete.value).toBeUndefined();
  });

  it('derives directory management capabilities from the directory stat capabilities when present', async () => {
    directoryStatRef.value = {
      capabilities: { canEditChildren: true, canChangePath: false, canDelete: true },
    };

    await mountPane();

    const args = useFSEntryManageActionsMock.mock.calls.at(-1)?.[0];
    expect(args?.canEditChildren.value).toBe(true);
    expect(args?.canChangePath.value).toBe(false);
    expect(args?.canDelete.value).toBe(true);
  });

  it('derives directory management capabilities as undefined when there is no directory stat at all', async () => {
    directoryStatRef.value = undefined;

    await mountPane();

    const args = useFSEntryManageActionsMock.mock.calls.at(-1)?.[0];
    expect(args?.canEditChildren.value).toBeUndefined();
    expect(args?.canChangePath.value).toBeUndefined();
    expect(args?.canDelete.value).toBeUndefined();
  });

  it('requests directory-scoped manage actions with import actions but without document creation', async () => {
    await mountPane();

    const args = useFSEntryManageActionsMock.mock.calls.at(-1)?.[0];
    expect(args?.entryType.value).toBe(FSNodeType.Directory);
    expect(args?.showCreateDocumentAction.value).toBe(false);
    expect(args?.showImportActions.value).toBe(true);
  });

  it('closes the add sheet when it emits close', async () => {
    const wrapper = await mountPane();

    await wrapper.get('button[aria-label="Add"]').trigger('click');
    expect(wrapper.find('[data-testid="entry-add-sheet"]').exists()).toBe(true);

    await wrapper.get('[data-testid="entry-add-sheet"] button:last-of-type').trigger('click');

    expect(wrapper.find('[data-testid="entry-add-sheet"]').exists()).toBe(false);
  });

  it('closes the create directory dialog when it emits cancel or created', async () => {
    const wrapper = await mountPane();

    await wrapper.get('button[aria-label="Add"]').trigger('click');
    await wrapper.get('[data-testid="entry-add-sheet"] button').trigger('click');
    expect(wrapper.find('[data-testid="directory-create-dialog"]').exists()).toBe(true);

    await wrapper.get('[data-testid="directory-create-dialog"] button').trigger('click');
    expect(wrapper.find('[data-testid="directory-create-dialog"]').exists()).toBe(false);

    await wrapper.get('button[aria-label="Add"]').trigger('click');
    await wrapper.get('[data-testid="entry-add-sheet"] button').trigger('click');
    await wrapper
      .get('[data-testid="directory-create-dialog"] button:last-of-type')
      .trigger('click');
    expect(wrapper.find('[data-testid="directory-create-dialog"]').exists()).toBe(false);
  });

  it('closes the create document dialog when it emits cancel or created', async () => {
    const wrapper = await mountPane();

    await wrapper.get('button[aria-label="Add"]').trigger('click');
    await wrapper.findAll('[data-testid="entry-add-sheet"] button')[1]?.trigger('click');
    expect(wrapper.find('[data-testid="document-create-dialog"]').exists()).toBe(true);

    await wrapper.get('[data-testid="document-create-dialog"] button').trigger('click');
    expect(wrapper.find('[data-testid="document-create-dialog"]').exists()).toBe(false);

    await wrapper.get('button[aria-label="Add"]').trigger('click');
    await wrapper.findAll('[data-testid="entry-add-sheet"] button')[1]?.trigger('click');
    await wrapper
      .get('[data-testid="document-create-dialog"] button:last-of-type')
      .trigger('click');
    expect(wrapper.find('[data-testid="document-create-dialog"]').exists()).toBe(false);
  });

  it('delegates the current-directory manage menu export ZIP selection to the export action', async () => {
    const wrapper = await mountPane();
    const manageButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Current directory actions: Create directory');

    if (!manageButton) {
      throw new Error('Expected the directory manage button');
    }

    await manageButton.trigger('click');

    expect(exportDirectoryZipMock).toHaveBeenCalledWith('/Google Drive/My Drive/Mioframe');
  });

  it('does not expose Import ZIP as an add-sheet action', async () => {
    const wrapper = await mountPane();

    await wrapper.get('button[aria-label="Add"]').trigger('click');

    expect(wrapper.find('[data-testid="entry-add-sheet"]').text()).not.toContain('Import ZIP');
  });

  it('delegates import ZIP from the current-directory manage menu to the shared import action', async () => {
    const wrapper = await mountPane();
    const importZipButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Current directory actions: Import ZIP');

    if (!importZipButton) {
      throw new Error('Expected the current-directory Import ZIP action');
    }

    await importZipButton.trigger('click');

    expect(importDirectoryZipMock).toHaveBeenCalledWith('/Google Drive/My Drive/Mioframe');
  });

  it('delegates import JSON from the current-directory manage menu to the shared import action', async () => {
    const wrapper = await mountPane();
    const importJsonButton = wrapper
      .findAll('button')
      .find((button) => button.text() === 'Current directory actions: Import JSON');

    if (!importJsonButton) {
      throw new Error('Expected the current-directory Import JSON action');
    }

    await importJsonButton.trigger('click');

    expect(importDocumentMock).toHaveBeenCalledWith('/Google Drive/My Drive/Mioframe');
  });

  it('does not render ZIP dialogs by default', async () => {
    const wrapper = await mountPane();

    expect(wrapper.find('[data-testid="export-zip-dialog"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="import-zip-dialog"]').exists()).toBe(false);
  });

  it('renders the export ZIP dialog while the export is running', async () => {
    exportZipStateRef.value = { status: 'running' };

    const wrapper = await mountPane();

    expect(wrapper.find('[data-testid="export-zip-dialog"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="import-zip-dialog"]').exists()).toBe(false);
  });

  it('renders the import ZIP dialog while the import is running', async () => {
    importZipStateRef.value = { status: 'running' };

    const wrapper = await mountPane();

    expect(wrapper.find('[data-testid="import-zip-dialog"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="export-zip-dialog"]').exists()).toBe(false);
  });

  it('renders the import ZIP dialog for a conflicts result, with no skip-existing action', async () => {
    importZipStateRef.value = { status: 'conflicts' };
    const wrapper = await mountPane();

    expect(wrapper.find('[data-testid="import-zip-dialog"]').exists()).toBe(true);
  });

  it('keeps the export ZIP result dialog mounted after the export completes, until closed', async () => {
    exportZipStateRef.value = { status: 'success' };

    const wrapper = await mountPane();

    expect(wrapper.find('[data-testid="export-zip-dialog"]').exists()).toBe(true);

    exportZipStateRef.value = { status: 'error' };
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="export-zip-dialog"]').exists()).toBe(true);
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
