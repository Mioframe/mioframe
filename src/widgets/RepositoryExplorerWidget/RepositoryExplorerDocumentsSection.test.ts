/* eslint-disable vue/one-component-per-file -- Focused widget contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { Repo } from '@automerge/automerge-repo';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

const createDocumentId = () => new Repo().create({}).documentId;

vi.mock('@feature/documentManage', () => ({
  DocumentManageMenuButton: defineComponent({
    name: 'DocumentManageMenuButtonStub',
    setup() {
      return () => h('span', 'document-manage');
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
});
/* eslint-enable vue/one-component-per-file -- Re-enable after focused inline stubs. */
