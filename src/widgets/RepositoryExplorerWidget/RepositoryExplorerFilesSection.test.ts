/* eslint-disable vue/one-component-per-file -- Focused widget contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { FSNodeType } from '@shared/lib/virtualFileSystem';

const exportZipStateRef = ref<{ status: string }>({ status: 'idle' });
const importZipStateRef = ref<{ status: string }>({ status: 'idle' });
const exportDirectoryZip = vi.fn();
const importDirectoryZip = vi.fn();
const closeExportZipDialog = vi.fn();
const closeImportZipDialog = vi.fn();
const removeEntry = vi.fn();
const importDocument = vi.fn();

vi.mock('@feature/entryRemove', () => ({
  useRemoveFSEntry: () => ({ remove: removeEntry }),
}));

vi.mock('@feature/importDocument', () => ({
  useImportDocumentAction: () => ({ importDocument }),
}));

vi.mock('@feature/directoryCreate', () => ({
  DirectoryCreateDialog: defineComponent({
    name: 'DirectoryCreateDialogStub',
    props: { path: { type: String, required: true } },
    emits: ['created'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          type: 'button',
          'data-testid': `directory-create-dialog-${props.path}`,
          onClick: () => {
            emit('created', 'created-name');
          },
        });
    },
  }),
}));

vi.mock('@feature/documentCreate', () => ({
  DocumentCreationDialog: defineComponent({
    name: 'DocumentCreationDialogStub',
    props: { path: { type: String, required: true } },
    emits: ['created'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          type: 'button',
          'data-testid': `document-create-dialog-${props.path}`,
          onClick: () => {
            emit('created');
          },
        });
    },
  }),
}));

vi.mock('@feature/entryRename', () => ({
  FSEntryRenameDialog: defineComponent({
    name: 'FSEntryRenameDialogStub',
    props: { path: { type: String, required: true } },
    emits: ['renamed'],
    setup(props, { emit }) {
      return () =>
        h('button', {
          type: 'button',
          'data-testid': `rename-dialog-${props.path}`,
          onClick: () => {
            emit('renamed', 'renamed-name');
          },
        });
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

vi.mock('@feature/exportZip', () => ({
  useExportDirectoryZip: () => ({
    exportDirectoryZip,
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

vi.mock('@feature/importZip', () => ({
  useImportZipAction: () => ({
    importDirectoryZip,
    state: importZipStateRef,
    closeImportZipDialog,
  }),
  ImportZipDialog: defineComponent({
    name: 'ImportZipDialogStub',
    props: { state: { type: Object, required: true } },
    emits: ['close'],
    setup(_props, { emit }) {
      return () =>
        h('button', {
          type: 'button',
          'data-testid': 'import-zip-dialog',
          onClick: () => {
            emit('close');
          },
        });
    },
  }),
}));

vi.mock('./RepositoryExplorerFileListItem.vue', () => ({
  default: defineComponent({
    name: 'RepositoryExplorerFileListItemStub',
    inheritAttrs: false,
    props: {
      directoryPath: { type: String, required: true },
      name: { type: String, required: true },
      // eslint-disable-next-line vue/require-prop-types -- Test stub accepts enum runtime values only.
      entryType: { required: true },
      description: { type: String, default: undefined },
      canEditChildren: { type: Boolean, default: undefined },
      canChangePath: { type: Boolean, default: undefined },
      canDelete: { type: Boolean, default: undefined },
    },
    emits: [
      'click',
      'selectCreateDirectory',
      'selectCreateDocument',
      'selectRename',
      'selectRemove',
      'selectImportJson',
      'selectExportZip',
      'selectImportZip',
    ],
    setup(props, { emit }) {
      return () => {
        const isInteractive =
          props.entryType === FSNodeType.Directory ||
          (props.entryType === FSNodeType.File && props.name.toLowerCase().endsWith('.json'));
        const entryPath = `${props.directoryPath}/${props.name}`;
        return [
          h(
            isInteractive ? 'button' : 'div',
            {
              ...(isInteractive
                ? {
                    type: 'button',
                    onClick: () => {
                      emit('click', props.name);
                    },
                  }
                : {}),
            },
            props.name,
          ),
          h('span', {
            'data-testid': `select-create-directory-${props.name}`,
            onClick: () => {
              emit('selectCreateDirectory', entryPath);
            },
          }),
          h('span', {
            'data-testid': `select-create-document-${props.name}`,
            onClick: () => {
              emit('selectCreateDocument', entryPath);
            },
          }),
          h('span', {
            'data-testid': `select-rename-${props.name}`,
            onClick: () => {
              emit('selectRename', entryPath);
            },
          }),
          h('span', {
            'data-testid': `select-remove-${props.name}`,
            onClick: () => {
              emit('selectRemove', entryPath);
            },
          }),
          h('span', {
            'data-testid': `select-import-json-${props.name}`,
            onClick: () => {
              emit('selectImportJson', entryPath);
            },
          }),
          h('span', {
            'data-testid': `select-export-zip-${props.name}`,
            onClick: () => {
              emit('selectExportZip', entryPath);
            },
          }),
          h('span', {
            'data-testid': `select-import-zip-${props.name}`,
            onClick: () => {
              emit('selectImportZip', entryPath);
            },
          }),
        ];
      };
    },
  }),
}));

describe('RepositoryExplorerFilesSection', () => {
  afterEach(() => {
    exportZipStateRef.value = { status: 'idle' };
    importZipStateRef.value = { status: 'idle' };
    exportDirectoryZip.mockClear();
    importDirectoryZip.mockClear();
    closeExportZipDialog.mockClear();
    closeImportZipDialog.mockClear();
    removeEntry.mockClear();
    importDocument.mockClear();
  });

  it('renders directories as interactive and emits selectPath for them', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
          ['note.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
        ],
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.text()).toContain('Nested');
    expect(wrapper.text()).toContain('note.txt');

    await buttons[0]?.trigger('click');

    expect(wrapper.emitted('selectPath')).toEqual([['/repo/Nested']]);
    expect(wrapper.emitted('selectJsonFile')).toBeUndefined();
    expect(wrapper.findAll('div').some((element) => element.text().includes('note.txt'))).toBe(
      true,
    );
  });

  it('renders .json regular files as interactive and emits selectJsonFile for them', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['doc.json', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
          ['note.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
        ],
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(1);
    expect(buttons[0]?.text()).toContain('doc.json');

    await buttons[0]?.trigger('click');

    expect(wrapper.emitted('selectJsonFile')).toEqual([['/repo/doc.json']]);
    expect(wrapper.emitted('selectPath')).toBeUndefined();
  });

  it('keeps non-JSON regular files non-interactive', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['note.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
          ['image.png', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
        ],
      },
    });

    expect(wrapper.findAll('button')).toHaveLength(0);
  });

  it('detects .json extension case-insensitively', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['DATA.JSON', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
          ['mixed.Json', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
          ['note.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
        ],
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
    const buttonTexts = buttons.map((b) => b.text());
    expect(buttonTexts.some((t) => t.includes('DATA.JSON'))).toBe(true);
    expect(buttonTexts.some((t) => t.includes('mixed.Json'))).toBe(true);
  });

  it('does not treat a directory named something.json as a json file entry', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['backup.json', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
        ],
      },
    });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(1);

    await buttons[0]?.trigger('click');

    expect(wrapper.emitted('selectPath')).toEqual([['/repo/backup.json']]);
    expect(wrapper.emitted('selectJsonFile')).toBeUndefined();
  });

  it('unmounts a removed entry, tearing down any menu/dialog state it owned', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
          ['note.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
        ],
      },
    });

    expect(wrapper.findComponent({ name: 'RepositoryExplorerFileListItemStub' }).exists()).toBe(
      true,
    );
    expect(wrapper.findAllComponents({ name: 'RepositoryExplorerFileListItemStub' })).toHaveLength(
      2,
    );

    await wrapper.setProps({
      regularFileEntries: [
        ['note.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
      ],
    });

    const remaining = wrapper.findAllComponents({ name: 'RepositoryExplorerFileListItemStub' });
    expect(remaining).toHaveLength(1);
    expect(remaining[0]?.props('name')).toBe('note.txt');
    expect(wrapper.text()).not.toContain('Nested');
  });

  it('matches the supporting copy to whether Automerge files are hidden', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const hiddenWrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [],
      },
    });

    const visibleWrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: false,
        regularFileEntries: [],
      },
    });

    expect(hiddenWrapper.text()).toContain('Mioframe service files are hidden.');
    expect(visibleWrapper.text()).toContain('Mioframe document files');
    expect(visibleWrapper.text()).not.toContain('Mioframe service files are hidden.');
    expect(hiddenWrapper.text()).toContain(
      'No regular files or folders to show. Mioframe service files are hidden.',
    );
    expect(visibleWrapper.text()).toContain(
      'No regular files, folders, or Mioframe document files to show.',
    );
    expect(hiddenWrapper.findAll('button')).toHaveLength(0);
    expect(visibleWrapper.findAll('button')).toHaveLength(0);
  });

  it('does not render ZIP dialogs by default', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
        ],
      },
    });

    expect(wrapper.find('[data-testid="export-zip-dialog"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="import-zip-dialog"]').exists()).toBe(false);
  });

  it('exports the selected nested directory as a ZIP archive using the emitted entry path', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
        ],
      },
    });

    await wrapper.find('[data-testid="select-export-zip-Nested"]').trigger('click');

    expect(exportDirectoryZip).toHaveBeenCalledTimes(1);
    expect(exportDirectoryZip).toHaveBeenCalledWith('/repo/Nested');
  });

  it('imports a ZIP archive into the selected nested directory using the emitted entry path', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
        ],
      },
    });

    await wrapper.find('[data-testid="select-import-zip-Nested"]').trigger('click');

    expect(importDirectoryZip).toHaveBeenCalledTimes(1);
    expect(importDirectoryZip).toHaveBeenCalledWith('/repo/Nested');
  });

  it('renders the export ZIP dialog while the export is running and closes it through the dialog action', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');
    exportZipStateRef.value = { status: 'running' };

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
        ],
      },
    });

    const dialog = wrapper.find('[data-testid="export-zip-dialog"]');
    expect(dialog.exists()).toBe(true);
    expect(wrapper.find('[data-testid="import-zip-dialog"]').exists()).toBe(false);

    await dialog.trigger('click');
    expect(closeExportZipDialog).toHaveBeenCalledOnce();
  });

  it('renders the import ZIP dialog while the import is running and closes it through the dialog action', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');
    importZipStateRef.value = { status: 'running' };

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
        ],
      },
    });

    const dialog = wrapper.find('[data-testid="import-zip-dialog"]');
    expect(dialog.exists()).toBe(true);
    expect(wrapper.find('[data-testid="export-zip-dialog"]').exists()).toBe(false);

    await dialog.trigger('click');
    expect(closeImportZipDialog).toHaveBeenCalledOnce();
  });

  it('removes an entry using the emitted entry path', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
        ],
      },
    });

    await wrapper.find('[data-testid="select-remove-Nested"]').trigger('click');

    expect(removeEntry).toHaveBeenCalledTimes(1);
    expect(removeEntry).toHaveBeenCalledWith('/repo/Nested');
  });

  it('imports a JSON document using the emitted entry path', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
        ],
      },
    });

    await wrapper.find('[data-testid="select-import-json-Nested"]').trigger('click');

    expect(importDocument).toHaveBeenCalledTimes(1);
    expect(importDocument).toHaveBeenCalledWith('/repo/Nested');
  });

  it('opens the create-directory dialog once at section level and closes it when created', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
        ],
      },
    });

    expect(wrapper.find('[data-testid="directory-create-dialog-/repo/Nested"]').exists()).toBe(
      false,
    );

    await wrapper.find('[data-testid="select-create-directory-Nested"]').trigger('click');

    const dialog = wrapper.find('[data-testid="directory-create-dialog-/repo/Nested"]');
    expect(dialog.exists()).toBe(true);

    await dialog.trigger('click');
    expect(wrapper.find('[data-testid="directory-create-dialog-/repo/Nested"]').exists()).toBe(
      false,
    );
  });

  it('opens the create-document dialog once at section level and closes it on cancel', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
        ],
      },
    });

    await wrapper.find('[data-testid="select-create-document-Nested"]').trigger('click');

    const dialog = wrapper.find('[data-testid="document-create-dialog-/repo/Nested"]');
    expect(dialog.exists()).toBe(true);

    await dialog.trigger('click');
    expect(wrapper.find('[data-testid="document-create-dialog-/repo/Nested"]').exists()).toBe(
      false,
    );
  });

  it('opens the rename dialog once at section level and closes it when renamed', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
        ],
      },
    });

    await wrapper.find('[data-testid="select-rename-Nested"]').trigger('click');

    const dialog = wrapper.find('[data-testid="rename-dialog-/repo/Nested"]');
    expect(dialog.exists()).toBe(true);

    await dialog.trigger('click');
    expect(wrapper.find('[data-testid="rename-dialog-/repo/Nested"]').exists()).toBe(false);
  });

  it('closes the open rename dialog when the selected entry is no longer present', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        regularFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
          ['note.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
        ],
      },
    });

    await wrapper.find('[data-testid="select-rename-Nested"]').trigger('click');
    expect(wrapper.find('[data-testid="rename-dialog-/repo/Nested"]').exists()).toBe(true);

    await wrapper.setProps({
      regularFileEntries: [
        ['note.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
      ],
    });

    expect(wrapper.find('[data-testid="rename-dialog-/repo/Nested"]').exists()).toBe(false);
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after focused inline stubs. */
