/* eslint-disable vue/one-component-per-file -- Focused widget contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { defineMenuButtonList, type NonEmptyMenuButtonList } from '@shared/ui/Menu';

const hasActionsRef = ref(false);
const nonEmptyActionButtonsRef = ref<NonEmptyMenuButtonList | null>(
  defineMenuButtonList([{ key: 'rename', label: 'Rename', symbolName: 'edit' }] as const),
);
const capturedShowDocumentActions: Array<boolean | undefined> = [];
const capturedManageButtonProps: Array<{ path: string; actionsLength: number }> = [];

vi.mock('@feature/entryManage', () => ({
  useFSEntryManageActions: (options: { showDocumentActions?: { value?: boolean | undefined } }) => {
    capturedShowDocumentActions.push(options.showDocumentActions?.value);
    return {
      hasActions: hasActionsRef,
      actionButtons: ref([]),
      nonEmptyActionButtons: nonEmptyActionButtonsRef,
    };
  },
  useEntryManageDialogState: () => ({
    showCreateDirectoryDialog: ref(false),
    showCreateDocumentDialog: ref(false),
    showRenameDialog: ref(false),
    onSelectCreateDirectory: vi.fn(),
    onSelectCreateDocument: vi.fn(),
    onSelectRename: vi.fn(),
    onSelectRemove: vi.fn(),
    onSelectImportJson: vi.fn(),
    onCloseCreateDirectoryDialog: vi.fn(),
    onCloseCreateDocumentDialog: vi.fn(),
    onCloseRenameDialog: vi.fn(),
  }),
}));

vi.mock('@entity/fsEntry', () => ({
  FSEntryMDListItem: defineComponent({
    name: 'FSEntryMDListItemStub',
    props: {
      name: { type: String, required: true },
      isOpenable: { type: Boolean, default: false },
      type: { type: Number, required: true },
      supportingText: { type: String, default: undefined },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          props.isOpenable ? 'button' : 'div',
          {
            ...(props.isOpenable
              ? {
                  type: 'button',
                  onClick: () => {
                    emit('click', props.name);
                  },
                }
              : {}),
          },
          [props.name, slots.trailingAction?.()],
        );
    },
  }),
}));

vi.mock('./RepositoryExplorerEntryManageButton.vue', () => ({
  default: defineComponent({
    name: 'RepositoryExplorerEntryManageButtonStub',
    props: {
      path: { type: String, required: true },
      actions: { type: Array, required: true },
    },
    setup(props) {
      return () => {
        capturedManageButtonProps.push({ path: props.path, actionsLength: props.actions.length });
        return h('button', { 'data-testid': 'manage-button', type: 'button' }, 'Manage');
      };
    },
  }),
}));

const mountItem = async (overrides?: {
  entryType?: FSNodeType;
  name?: string;
  directoryPath?: string;
  description?: string;
  canEditChildren?: boolean;
  canChangePath?: boolean;
  canDelete?: boolean;
}) => {
  const { default: RepositoryExplorerFileListItem } =
    await import('./RepositoryExplorerFileListItem.vue');
  return mount(RepositoryExplorerFileListItem, {
    props: {
      directoryPath: overrides?.directoryPath ?? '/repo',
      name: overrides?.name ?? 'entry',
      entryType: overrides?.entryType ?? FSNodeType.File,
      ...(overrides?.description !== undefined ? { description: overrides.description } : {}),
      ...(overrides?.canEditChildren !== undefined
        ? { canEditChildren: overrides.canEditChildren }
        : {}),
      ...(overrides?.canChangePath !== undefined ? { canChangePath: overrides.canChangePath } : {}),
      ...(overrides?.canDelete !== undefined ? { canDelete: overrides.canDelete } : {}),
    },
  });
};

describe('RepositoryExplorerFileListItem', () => {
  afterEach(() => {
    hasActionsRef.value = false;
    nonEmptyActionButtonsRef.value = defineMenuButtonList([
      { key: 'rename', label: 'Rename', symbolName: 'edit' },
    ] as const);
    capturedShowDocumentActions.length = 0;
    capturedManageButtonProps.length = 0;
    document.body.innerHTML = '';
  });

  it('renders the manage button when hasActions is true', async () => {
    hasActionsRef.value = true;

    const wrapper = await mountItem();

    expect(wrapper.find('[data-testid="manage-button"]').exists()).toBe(true);
    expect(capturedManageButtonProps).toEqual([{ path: '/repo/entry', actionsLength: 1 }]);
  });

  it('does not render the manage button when hasActions is false', async () => {
    hasActionsRef.value = false;

    const wrapper = await mountItem();

    expect(wrapper.find('[data-testid="manage-button"]').exists()).toBe(false);
  });

  it('does not render the manage button when capabilities produce no actions', async () => {
    hasActionsRef.value = false;

    const wrapper = await mountItem({
      entryType: FSNodeType.File,
      canEditChildren: false,
      canChangePath: false,
      canDelete: false,
    });

    expect(wrapper.find('[data-testid="manage-button"]').exists()).toBe(false);
  });

  it('does not render the manage button when the derived non-empty action list is absent', async () => {
    hasActionsRef.value = true;
    nonEmptyActionButtonsRef.value = null;

    const wrapper = await mountItem({ entryType: FSNodeType.Directory });

    expect(wrapper.find('[data-testid="manage-button"]').exists()).toBe(false);
  });

  it('renders the manage button when capabilities produce actions', async () => {
    hasActionsRef.value = true;

    const wrapper = await mountItem({
      entryType: FSNodeType.Directory,
      canChangePath: true,
      canDelete: true,
    });

    expect(wrapper.find('[data-testid="manage-button"]').exists()).toBe(true);
    expect(capturedManageButtonProps.at(-1)).toEqual({ path: '/repo/entry', actionsLength: 1 });
  });

  it('renders directory entries as interactive buttons', async () => {
    const wrapper = await mountItem({ entryType: FSNodeType.Directory, name: 'MyDir' });

    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.text()).toContain('MyDir');
  });

  it('renders file entries as non-interactive elements', async () => {
    const wrapper = await mountItem({ entryType: FSNodeType.File, name: 'note.txt' });

    expect(wrapper.find('button').exists()).toBe(false);
    expect(wrapper.text()).toContain('note.txt');
  });

  it('emits click with the entry name when a directory is clicked', async () => {
    const wrapper = await mountItem({ entryType: FSNodeType.Directory, name: 'ClickMe' });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('click')).toEqual([['ClickMe']]);
  });

  it('does not render the manage button for a file entry with no actions', async () => {
    hasActionsRef.value = false;

    const wrapper = await mountItem({ entryType: FSNodeType.File, name: 'file.txt' });

    expect(wrapper.find('[data-testid="manage-button"]').exists()).toBe(false);
  });

  it('passes showDocumentActions=true for directory entries', async () => {
    await mountItem({ entryType: FSNodeType.Directory });

    expect(capturedShowDocumentActions.at(-1)).toBe(true);
  });

  it('passes showDocumentActions=false for file entries', async () => {
    await mountItem({ entryType: FSNodeType.File });

    expect(capturedShowDocumentActions.at(-1)).toBe(false);
  });

  it('does not create a primary click target for non-openable file entries that have manage actions', async () => {
    hasActionsRef.value = true;

    const wrapper = await mountItem({ entryType: FSNodeType.File, name: 'file.txt' });

    expect(wrapper.find('[data-testid="manage-button"]').exists()).toBe(true);
    expect(wrapper.element.tagName.toLowerCase()).not.toBe('button');
    expect(wrapper.find('button:not([data-testid="manage-button"])').exists()).toBe(false);
  });

  it('does not emit click when a non-openable file entry with manage actions is activated', async () => {
    hasActionsRef.value = true;

    const wrapper = await mountItem({ entryType: FSNodeType.File, name: 'file.txt' });

    await wrapper.trigger('click');

    expect(wrapper.emitted('click')).toBeUndefined();
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
