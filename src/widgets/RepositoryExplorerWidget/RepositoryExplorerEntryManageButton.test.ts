/* eslint-disable vue/one-component-per-file -- Focused component contract test with inline stubs. */
import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { FSNodeType } from '@shared/lib/virtualFileSystem';

vi.mock('@feature/entryRemove', () => ({
  useRemoveFSEntry: () => ({ remove: vi.fn() }),
}));

vi.mock('@feature/importDocument', () => ({
  useImportDocumentAction: () => ({ importDocument: vi.fn() }),
}));

vi.mock('@feature/directoryCreate', () => ({
  DirectoryCreateDialog: defineComponent({
    name: 'DirectoryCreateDialogStub',
    emits: ['cancel'],
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
            'Cancel',
          ),
        ]);
    },
  }),
}));

vi.mock('@feature/documentCreate', () => ({
  DocumentCreationDialog: defineComponent({
    name: 'DocumentCreationDialogStub',
    emits: ['cancel'],
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
            'Cancel',
          ),
        ]);
    },
  }),
}));

vi.mock('@feature/entryRename', () => ({
  FSEntryRenameDialog: defineComponent({
    name: 'FSEntryRenameDialogStub',
    emits: ['cancel'],
    setup(_props, { emit }) {
      return () =>
        h('div', { 'data-testid': 'rename-dialog' }, [
          h(
            'button',
            {
              onClick: () => {
                emit('cancel');
              },
            },
            'Cancel',
          ),
        ]);
    },
  }),
}));

vi.mock('@feature/entryManage', async (importOriginal) => {
  const original = await importOriginal<typeof import('@feature/entryManage')>();
  return {
    ...original,
    FSEntryManageMenuButton: defineComponent({
      name: 'FSEntryManageMenuButtonStub',
      emits: ['selectRename'],
      setup(_props, { emit }) {
        return () =>
          h(
            'button',
            {
              'data-testid': 'entry-manage-menu-button',
              onClick: () => {
                emit('selectRename');
              },
            },
            'Menu',
          );
      },
    }),
  };
});

vi.mock('@shared/ui/Menu', async (importOriginal) => {
  const original = await importOriginal<typeof import('@shared/ui/Menu')>();
  return { ...original };
});

const mountButton = async (overrides?: {
  path?: string;
  entryType?: FSNodeType;
  canEditChildren?: boolean;
  canChangePath?: boolean;
  canDelete?: boolean;
  showDocumentActions?: boolean;
}) => {
  const { default: RepositoryExplorerEntryManageButton } =
    await import('./RepositoryExplorerEntryManageButton.vue');
  return mount(RepositoryExplorerEntryManageButton, {
    props: {
      path: overrides?.path ?? '/test/entry',
      entryType: overrides?.entryType ?? FSNodeType.Directory,
      ...(overrides?.canEditChildren !== undefined
        ? { canEditChildren: overrides.canEditChildren }
        : {}),
      ...(overrides?.canChangePath !== undefined ? { canChangePath: overrides.canChangePath } : {}),
      ...(overrides?.canDelete !== undefined ? { canDelete: overrides.canDelete } : {}),
      ...(overrides?.showDocumentActions !== undefined
        ? { showDocumentActions: overrides.showDocumentActions }
        : {}),
    },
  });
};

describe('RepositoryExplorerEntryManageButton', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('always renders the menu button — parent composition is responsible for the hasActions guard', async () => {
    const wrapper = await mountButton({
      canEditChildren: false,
      canChangePath: false,
      canDelete: false,
    });

    expect(wrapper.find('[data-testid="entry-manage-menu-button"]').exists()).toBe(true);
  });

  it('does not call useFSNodeStat — capabilities come from props', async () => {
    // This test verifies the contract: the component must receive capabilities via props.
    // If useFSNodeStat were called it would throw in this environment without a mock.
    // No @entity/fsEntry mock is configured here intentionally.
    const wrapper = await mountButton({
      canEditChildren: true,
      canChangePath: true,
      canDelete: true,
    });

    expect(wrapper.find('[data-testid="entry-manage-menu-button"]').exists()).toBe(true);
  });

  it('resets open dialogs when the path prop changes', async () => {
    const wrapper = await mountButton({ path: '/dir-a/docs' });

    await wrapper.find('[data-testid="entry-manage-menu-button"]').trigger('click');
    await flushPromises();
    expect(wrapper.find('[data-testid="rename-dialog"]').exists()).toBe(true);

    await wrapper.setProps({ path: '/dir-b/docs' });
    await flushPromises();

    expect(wrapper.find('[data-testid="rename-dialog"]').exists()).toBe(false);
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
