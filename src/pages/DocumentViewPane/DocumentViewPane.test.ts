/* eslint-disable vue/one-component-per-file -- Focused pane contract test with inline stubs. */
import { Repo } from '@automerge/automerge-repo';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { DomainError } from '@shared/lib/error';

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
        h('header', [h('h1', props.headline), slots.leadingButton?.(), slots.trailingElements?.()]);
    },
  }),
}));

vi.mock('@shared/ui/Button', () => ({
  MDIconButton: defineComponent({
    name: 'MDIconButtonStub',
    setup() {
      return () => h('button', { type: 'button' }, 'Rename document');
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

vi.mock('@shared/ui/ProgressIndicators', () => ({
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

const mountPane = async () => {
  const { default: DocumentViewPane } = await import('./DocumentViewPane.vue');

  return mount(DocumentViewPane, {
    props: {
      documentDirectory: '/Browser Storage',
      documentId: createDocumentId(),
    },
    slots: {
      navigationButton: () => h('button', 'Back'),
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
});

/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
