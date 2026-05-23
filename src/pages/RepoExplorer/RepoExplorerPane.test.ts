/* eslint-disable vue/one-component-per-file -- Focused pane contract test with inline stubs. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';

const canEditChildren = ref(true);
const { openMock, importDocumentMock } = vi.hoisted(() => ({
  openMock: vi.fn(),
  importDocumentMock: vi.fn(),
}));

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

vi.mock('@feature/directoryCreate', () => ({
  DirectoryCreateDialog: defineComponent({
    name: 'DirectoryCreateDialogStub',
    setup() {
      return () => h('div', { 'data-testid': 'directory-create-dialog' });
    },
  }),
}));

vi.mock('@feature/documentAdd', () => ({
  DocumentAddSheet: defineComponent({
    name: 'DocumentAddSheetStub',
    emits: ['close', 'selectCreate', 'selectImport'],
    setup(_props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'document-add-sheet' }, [
          h(
            'button',
            {
              onClick: () => {
                emit('selectCreate');
              },
            },
            'Create from sheet',
          ),
          h(
            'button',
            {
              onClick: () => {
                emit('selectImport');
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

vi.mock('@feature/entryManage', () => ({
  FSEntryManageMenuButton: defineComponent({
    name: 'FSEntryManageMenuButtonStub',
    setup() {
      return () => h('button', 'Current directory actions');
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
  MDFab: defineComponent({
    name: 'MDFabStub',
    props: {
      tooltip: {
        type: String,
        required: true,
      },
      label: {
        type: String,
        default: undefined,
      },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            'aria-label': props.tooltip,
            onClick: () => {
              emit('click', new MouseEvent('click'));
            },
          },
          props.label ?? slots.icon?.(),
        );
    },
  }),
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
  RepositoryExplorerWidget: defineComponent({
    name: 'RepositoryExplorerWidgetStub',
    emits: ['clickPath', 'clickReturnHome', 'clickDocument'],
    setup(_props, { slots, emit }) {
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
    openMock.mockReset();
    importDocumentMock.mockReset();
    document.body.innerHTML = '';
  });

  it('keeps the document add CTA separate from the create-folder FAB and opens the add sheet', async () => {
    const wrapper = await mountPane();

    expect(wrapper.text()).toContain('Current directory actions');
    expect(wrapper.text()).toContain('Add');
    expect(wrapper.find('button[aria-label="Add document"]').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="Create directory"]').exists()).toBe(true);

    await wrapper.get('button[aria-label="Add document"]').trigger('click');

    expect(wrapper.find('[data-testid="document-add-sheet"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="directory-create-dialog"]').exists()).toBe(false);
  });

  it('shows the create-folder FAB only when the directory allows editing children', async () => {
    canEditChildren.value = false;

    const wrapper = await mountPane();

    expect(wrapper.find('button[aria-label="Add document"]').exists()).toBe(false);
    expect(wrapper.find('button[aria-label="Create directory"]').exists()).toBe(false);
  });

  it('renders the current folder title and keeps dialogs hidden by default', async () => {
    const wrapper = await mountPane();

    expect(wrapper.text()).toContain('Mioframe');
    expect(wrapper.find('[data-testid="document-add-sheet"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="document-create-dialog"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="directory-create-dialog"]').exists()).toBe(false);
  });

  it('opens the create document dialog after selecting create from the add sheet', async () => {
    const wrapper = await mountPane();

    await wrapper.get('button[aria-label="Add document"]').trigger('click');
    await wrapper.get('[data-testid="document-add-sheet"] button').trigger('click');

    expect(wrapper.find('[data-testid="document-create-dialog"]').exists()).toBe(true);
  });

  it('delegates import from the add sheet to the shared import action', async () => {
    const wrapper = await mountPane();

    await wrapper.get('button[aria-label="Add document"]').trigger('click');
    await wrapper.findAll('[data-testid="document-add-sheet"] button')[1]?.trigger('click');

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
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
