/* eslint-disable vue/one-component-per-file -- Focused pane contract test with inline stubs. */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { mount } from '@vue/test-utils';

const canEditChildren = ref(true);

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
    open: vi.fn(),
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
    setup() {
      return () => h('div', { 'data-testid': 'document-add-sheet' });
    },
  }),
}));

vi.mock('@feature/repoExplorerScreenMenu', () => ({
  RepoExplorerScreenMenuButton: defineComponent({
    name: 'RepoExplorerScreenMenuButtonStub',
    setup() {
      return () => h('button', 'Меню экрана');
    },
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
    setup(_props, { slots }) {
      return () => h('main', [slots.after?.()]);
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
    document.body.innerHTML = '';
  });

  it('keeps the document add CTA separate from the create-folder FAB and opens the add sheet', async () => {
    const wrapper = await mountPane();

    expect(wrapper.text()).toContain('+ Добавить');
    expect(wrapper.find('button[aria-label="Добавить в документы Mioframe"]').exists()).toBe(true);
    expect(wrapper.find('button[aria-label="Create directory"]').exists()).toBe(true);

    await wrapper.get('button[aria-label="Добавить в документы Mioframe"]').trigger('click');

    expect(wrapper.find('[data-testid="document-add-sheet"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="directory-create-dialog"]').exists()).toBe(false);
  });

  it('shows the create-folder FAB only when the directory allows editing children', async () => {
    canEditChildren.value = false;

    const wrapper = await mountPane();

    expect(wrapper.find('button[aria-label="Добавить в документы Mioframe"]').exists()).toBe(false);
    expect(wrapper.find('button[aria-label="Create directory"]').exists()).toBe(false);
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
