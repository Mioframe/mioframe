/* eslint-disable vue/one-component-per-file -- Focused widget contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { Repo } from '@automerge/automerge-repo';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';

const createDocumentId = () => new Repo().create({}).documentId;

const exportZipStateRef = ref<{ status: string }>({ status: 'idle' });
const exportDocumentZip = vi.fn();
const closeExportZipDialog = vi.fn();
const capturedManageButtonProps: Array<{ directoryPath: string; documentId: string }> = [];

vi.mock('@feature/documentManage', () => ({
  DocumentManageMenuButton: defineComponent({
    name: 'DocumentManageMenuButtonStub',
    props: {
      directoryPath: { type: String, required: true },
      documentId: { type: String, required: true },
    },
    emits: ['selectExportZip'],
    setup(props, { emit }) {
      return () => {
        capturedManageButtonProps.push({
          directoryPath: props.directoryPath,
          documentId: props.documentId,
        });
        return h('button', {
          type: 'button',
          'data-testid': 'document-manage',
          onClick: () => {
            emit('selectExportZip');
          },
        });
      };
    },
  }),
}));

vi.mock('@feature/exportZip', () => ({
  useExportDocumentZip: () => ({
    exportDocumentZip,
    state: exportZipStateRef,
    closeExportZipDialog,
  }),
  ExportZipDialog: defineComponent({
    name: 'ExportZipDialogStub',
    props: { state: { type: Object, required: true } },
    emits: ['close'],
    setup(_props, { emit }) {
      return () =>
        h('button', {
          type: 'button',
          'data-testid': 'export-zip-dialog',
          onClick: () => {
            emit('close');
          },
        });
    },
  }),
}));

vi.mock('@feature/mioframeStorageInfo', () => ({
  MioframeStorageInfoSheet: defineComponent({
    name: 'MioframeStorageInfoSheetStub',
    setup() {
      return () => h('div', 'storage-info');
    },
  }),
}));

vi.mock('@shared/ui/Button', () => ({
  MDIconButton: defineComponent({
    name: 'MDIconButtonStub',
    emits: ['click'],
    setup(_props, { emit }) {
      return () =>
        h('button', {
          type: 'button',
          onClick: () => {
            emit('click');
          },
        });
    },
  }),
}));

vi.mock('@shared/ui/EmptyState', () => ({
  MDEmptyState: defineComponent({
    name: 'MDEmptyStateStub',
    props: {
      headline: { type: String, required: true },
      supportingText: { type: String, required: true },
    },
    setup(props, { slots }) {
      return () => h('section', [props.headline, props.supportingText, slots.icon?.()]);
    },
  }),
}));

vi.mock('@shared/ui/Icon', () => ({
  MDSymbol: defineComponent({
    name: 'MDSymbolStub',
    setup() {
      return () => h('span', 'icon');
    },
  }),
}));

vi.mock('@shared/ui/Lists', () => ({
  MDList: defineComponent({
    name: 'MDListStub',
    setup(_props, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
}));

vi.mock('@entity/cfrDocument', () => ({
  CFRDocumentMDListItem: defineComponent({
    name: 'CFRDocumentMDListItemStub',
    props: {
      documentId: { type: String, required: true },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            onClick: () => {
              emit('click', props.documentId);
            },
          },
          [props.documentId, slots.trailingAction?.()],
        );
    },
  }),
}));

describe('RepositoryExplorerDocumentsSection', () => {
  afterEach(() => {
    exportZipStateRef.value = { status: 'idle' };
    exportDocumentZip.mockClear();
    closeExportZipDialog.mockClear();
    capturedManageButtonProps.length = 0;
  });

  it('shows the singular document count, emits selection, and opens storage info', async () => {
    const { default: RepositoryExplorerDocumentsSection } =
      await import('./RepositoryExplorerDocumentsSection.vue');
    const documentId = createDocumentId();

    const wrapper = mount(RepositoryExplorerDocumentsSection, {
      props: {
        directoryPath: '/repo',
        documentIds: [documentId],
        isRepositoryInitialized: true,
      },
    });

    expect(wrapper.text()).toContain('1 document');
    expect(wrapper.text()).not.toContain('No Mioframe documents yet.');
    expect(wrapper.text()).not.toContain('This folder is not a Mioframe space yet.');

    await wrapper.get('button').trigger('click');
    expect(wrapper.text()).toContain('storage-info');

    await wrapper.findAll('button')[1]?.trigger('click');
    expect(wrapper.emitted('selectDocument')).toEqual([[documentId]]);
  });

  it('shows the regular-folder empty state before repository storage is initialized', async () => {
    const { default: RepositoryExplorerDocumentsSection } =
      await import('./RepositoryExplorerDocumentsSection.vue');

    const wrapper = mount(RepositoryExplorerDocumentsSection, {
      props: {
        directoryPath: '/repo',
        documentIds: [],
        isRepositoryInitialized: false,
      },
    });

    expect(wrapper.text()).toContain('This folder is not a Mioframe space yet.');
    expect(wrapper.text()).toContain(
      'Add your first document to turn this folder into a Mioframe space.',
    );
  });

  it('shows the initialized empty-state copy when repository storage exists without documents', async () => {
    const { default: RepositoryExplorerDocumentsSection } =
      await import('./RepositoryExplorerDocumentsSection.vue');

    const wrapper = mount(RepositoryExplorerDocumentsSection, {
      props: {
        directoryPath: '/repo',
        documentIds: [],
        isRepositoryInitialized: true,
      },
    });

    expect(wrapper.text()).toContain('No Mioframe documents yet.');
    expect(wrapper.text()).toContain('Create or import a document to add Mioframe documents here.');
  });

  it('renders documents when document ids are available even without initialization marker state', async () => {
    const { default: RepositoryExplorerDocumentsSection } =
      await import('./RepositoryExplorerDocumentsSection.vue');
    const firstDocumentId = createDocumentId();
    const secondDocumentId = createDocumentId();

    const wrapper = mount(RepositoryExplorerDocumentsSection, {
      props: {
        directoryPath: '/repo',
        documentIds: [firstDocumentId, secondDocumentId],
        isRepositoryInitialized: false,
      },
    });

    expect(wrapper.text()).toContain('2 documents');
    expect(wrapper.text()).toContain(firstDocumentId);
    expect(wrapper.text()).toContain(secondDocumentId);
    expect(wrapper.text()).not.toContain('This folder is not a Mioframe space yet.');
  });

  it('does not render the export ZIP dialog by default', async () => {
    const { default: RepositoryExplorerDocumentsSection } =
      await import('./RepositoryExplorerDocumentsSection.vue');
    const documentId = createDocumentId();

    const wrapper = mount(RepositoryExplorerDocumentsSection, {
      props: {
        directoryPath: '/repo',
        documentIds: [documentId],
        isRepositoryInitialized: true,
      },
    });

    expect(wrapper.find('[data-testid="export-zip-dialog"]').exists()).toBe(false);
  });

  it('exports the selected document as a ZIP archive using the directory path and document id in scope', async () => {
    const { default: RepositoryExplorerDocumentsSection } =
      await import('./RepositoryExplorerDocumentsSection.vue');
    const firstDocumentId = createDocumentId();
    const secondDocumentId = createDocumentId();

    const wrapper = mount(RepositoryExplorerDocumentsSection, {
      props: {
        directoryPath: '/repo',
        documentIds: [firstDocumentId, secondDocumentId],
        isRepositoryInitialized: true,
      },
    });

    expect(capturedManageButtonProps).toEqual([
      { directoryPath: '/repo', documentId: firstDocumentId },
      { directoryPath: '/repo', documentId: secondDocumentId },
    ]);

    await wrapper.findAll('[data-testid="document-manage"]')[1]?.trigger('click');

    expect(exportDocumentZip).toHaveBeenCalledTimes(1);
    expect(exportDocumentZip).toHaveBeenCalledWith('/repo', secondDocumentId);
  });

  it('renders the export ZIP dialog while the export is running and closes it through the dialog action', async () => {
    const { default: RepositoryExplorerDocumentsSection } =
      await import('./RepositoryExplorerDocumentsSection.vue');
    const documentId = createDocumentId();
    exportZipStateRef.value = { status: 'running' };

    const wrapper = mount(RepositoryExplorerDocumentsSection, {
      props: {
        directoryPath: '/repo',
        documentIds: [documentId],
        isRepositoryInitialized: true,
      },
    });

    const dialog = wrapper.find('[data-testid="export-zip-dialog"]');
    expect(dialog.exists()).toBe(true);

    await dialog.trigger('click');
    expect(closeExportZipDialog).toHaveBeenCalledOnce();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after focused inline stubs. */
