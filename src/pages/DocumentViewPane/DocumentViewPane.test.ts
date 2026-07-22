/* eslint-disable vue/one-component-per-file -- Focused pane contract test with inline stubs. */
import { Repo } from '@automerge/automerge-repo';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { DomainError } from '@shared/lib/error';
import { DATABASE_DOCUMENT_TYPE } from '@shared/lib/databaseDocument';

const documentState = ref<{ name?: string; type?: string } | DomainError | undefined>({
  name: 'Quarterly Plan',
  type: 'database',
});
const isLoading = ref(false);
const errorMessage = ref<string | undefined>(undefined);

const createDocumentId = () => {
  const repo = new Repo();
  return repo.create({}).documentId;
};

vi.mock('@entity/cfrDocument', () => ({
  useDocument: () => ({
    state: documentState,
    isLoading,
    errorMessage,
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
        h('header', [
          h('h1', props.headline),
          slots.leadingButton
            ? h('span', { class: 'leading-button-slot' }, slots.leadingButton())
            : null,
          slots.trailingElements?.(),
        ]);
    },
  }),
}));

vi.mock('@shared/ui/Button', () => ({
  MDIconButton: defineComponent({
    name: 'MDIconButtonStub',
    setup() {
      return () =>
        h('button', { type: 'button', 'data-testid': 'rename-button' }, 'Rename document');
    },
  }),
}));

vi.mock('@shared/ui/EmptyState', () => ({
  MDEmptyState: defineComponent({
    name: 'MDEmptyStateStub',
    props: {
      headline: { type: String, required: true },
      supportingText: { type: String, default: undefined },
    },
    setup(props, { slots }) {
      return () => h('div', [props.headline, props.supportingText, slots.icon?.()]);
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

vi.mock('@shared/ui/material', () => ({
  MDCircularProgressIndicator: defineComponent({
    name: 'MDCircularProgressIndicatorStub',
    setup() {
      return () => h('div', 'loading');
    },
  }),
}));

vi.mock('@feature/documentRename', () => ({
  DocumentRenameDialog: defineComponent({
    name: 'DocumentRenameDialogStub',
    setup() {
      return () => h('div', { 'data-testid': 'rename-dialog' });
    },
  }),
}));

vi.mock('@widget/DocumentView/Database/DatabaseViewWidget.vue', () => ({
  default: defineComponent({
    name: 'DatabaseViewWidgetStub',
    setup() {
      return () => h('main', 'Database view');
    },
  }),
}));

const mountPane = async (options: { withNavigationButton?: boolean } = {}) => {
  const { withNavigationButton = true } = options;
  const { default: DocumentViewPane } = await import('./DocumentViewPane.vue');

  return mount(DocumentViewPane, {
    props: {
      documentDirectory: '/Browser Storage',
      documentId: createDocumentId(),
    },
    slots: {
      ...(withNavigationButton ? { navigationButton: () => h('button', 'Back') } : {}),
      appBarTrailing: () => h('span', 'Trailing'),
    },
  });
};

describe('DocumentViewPane', () => {
  afterEach(() => {
    documentState.value = { name: 'Quarterly Plan', type: 'database' };
    isLoading.value = false;
    errorMessage.value = undefined;
  });

  it('renders injected app-bar trailing content before pane-specific actions', async () => {
    const wrapper = await mountPane();
    const headerText = wrapper.get('header').text();

    const trailingIndex = headerText.indexOf('Trailing');
    const renameIndex = headerText.indexOf('Rename document');
    expect(trailingIndex).toBeGreaterThanOrEqual(0);
    expect(renameIndex).toBeGreaterThanOrEqual(0);
    expect(trailingIndex).toBeLessThan(renameIndex);
  });

  it('omits the leading-button slot when no navigationButton slot is provided', async () => {
    const wrapper = await mountPane({ withNavigationButton: false });

    expect(wrapper.find('.leading-button-slot').exists()).toBe(false);
  });

  it('renders the leading-button slot when a navigationButton slot is provided', async () => {
    const wrapper = await mountPane();

    expect(wrapper.find('.leading-button-slot').exists()).toBe(true);
    expect(wrapper.find('.leading-button-slot').text()).toBe('Back');
  });

  it('shows a loading headline and spinner while the document is loading', async () => {
    isLoading.value = true;
    const wrapper = await mountPane();

    expect(wrapper.get('h1').text()).toBe('Loading document');
    expect(wrapper.find('.document-view-pane__state').exists()).toBe(true);
    expect(wrapper.find('[data-testid="rename-dialog"]').exists()).toBe(false);
  });

  it('shows the document name as headline once loaded', async () => {
    const wrapper = await mountPane();

    expect(wrapper.get('h1').text()).toBe('Quarterly Plan');
  });

  it('falls back to "Document not found" in the headline and body when there is no document, no error, and no loading', async () => {
    documentState.value = undefined;
    const wrapper = await mountPane();

    expect(wrapper.get('h1').text()).toBe('Document not found');
    expect(wrapper.text()).toContain('Document not found');
    expect(wrapper.find('.document-view-pane__empty-state').exists()).toBe(true);
  });

  it('does not show the not-found state while loading even without a document', async () => {
    documentState.value = undefined;
    isLoading.value = true;
    const wrapper = await mountPane();

    expect(wrapper.find('.document-view-pane__state').exists()).toBe(true);
    expect(wrapper.find('.document-view-pane__empty-state').exists()).toBe(false);
  });

  it('does not show the not-found state when an error message is present, even without a document', async () => {
    documentState.value = undefined;
    errorMessage.value = 'Could not read this document';
    const wrapper = await mountPane();

    const emptyState = wrapper.get('.document-view-pane__empty-state');
    expect(emptyState.text()).toContain('Could not open document');
    expect(emptyState.text()).toContain('Could not read this document');
    expect(emptyState.text()).not.toContain('Document not found');
  });

  it('does not show the not-found state when a document is present', async () => {
    const wrapper = await mountPane();

    expect(wrapper.find('.document-view-pane__empty-state').exists()).toBe(false);
  });

  it('renders the database widget when the document type is the database type, and not the fallback pre element', async () => {
    documentState.value = { name: 'Quarterly Plan', type: DATABASE_DOCUMENT_TYPE };
    const wrapper = await mountPane();

    expect(wrapper.find('main').text()).toBe('Database view');
    expect(wrapper.find('pre').exists()).toBe(false);
  });

  it('renders the raw fallback pre element for a non-database document type', async () => {
    documentState.value = { name: 'Quarterly Plan', type: 'other' };
    const wrapper = await mountPane();

    expect(wrapper.find('main').exists()).toBe(false);
    expect(wrapper.find('pre').exists()).toBe(true);
  });

  it('renders the raw fallback pre element instead of the database widget when the document is a DomainError', async () => {
    documentState.value = new DomainError('Failed', { code: 'TEST_ERROR' });
    const wrapper = await mountPane();

    expect(wrapper.find('main').exists()).toBe(false);
    expect(wrapper.find('pre').exists()).toBe(true);
  });

  it('hides the rename button while loading', async () => {
    isLoading.value = true;
    const wrapper = await mountPane();

    expect(wrapper.get('header').text()).not.toContain('Rename document');
  });

  it('hides the rename button when an error message is present', async () => {
    errorMessage.value = 'Could not read this document';
    const wrapper = await mountPane();

    expect(wrapper.get('header').text()).not.toContain('Rename document');
  });

  it('hides the rename button when the document is a DomainError', async () => {
    documentState.value = new DomainError('Failed', { code: 'TEST_ERROR' });
    const wrapper = await mountPane();

    expect(wrapper.get('header').text()).not.toContain('Rename document');
  });

  it('hides the rename button when there is no document', async () => {
    documentState.value = undefined;
    const wrapper = await mountPane();

    expect(wrapper.get('header').text()).not.toContain('Rename document');
  });

  it('shows the rename button and opens/closes the rename dialog on click and on rename completion', async () => {
    const wrapper = await mountPane();

    expect(wrapper.find('[data-testid="rename-dialog"]').exists()).toBe(false);

    await wrapper.get('[data-testid="rename-button"]').trigger('click');

    expect(wrapper.find('[data-testid="rename-dialog"]').exists()).toBe(true);

    await wrapper.findComponent({ name: 'DocumentRenameDialogStub' }).vm.$emit('renamed');
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="rename-dialog"]').exists()).toBe(false);
  });
});

/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
