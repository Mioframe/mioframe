/* eslint-disable vue/one-component-per-file -- Focused widget contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { FSNodeType } from '@shared/lib/virtualFileSystem';

vi.mock('@shared/ui/Lists', () => ({
  MDListContainer: defineComponent({
    name: 'MDListContainerStub',
    setup(_props, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
}));

vi.mock('./RepositoryExplorerFileListItem.vue', () => ({
  default: defineComponent({
    name: 'RepositoryExplorerFileListItemStub',
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
    emits: ['click'],
    setup(props, { emit }) {
      return () => {
        const isInteractive =
          props.entryType === FSNodeType.Directory ||
          (props.entryType === FSNodeType.File && props.name.toLowerCase().endsWith('.json'));
        return h(
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
        );
      };
    },
  }),
}));

describe('RepositoryExplorerFilesSection', () => {
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
});
/* eslint-enable vue/one-component-per-file -- Re-enable after focused inline stubs. */
