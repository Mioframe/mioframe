/* eslint-disable vue/one-component-per-file -- Focused widget contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { FSNodeType } from '@shared/lib/virtualFileSystem';

const directoryNodeType: number = FSNodeType.Directory;

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
      entryType: { type: Number, required: true },
      description: { type: String, default: undefined },
    },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          props.entryType === directoryNodeType ? 'button' : 'div',
          {
            ...(props.entryType === directoryNodeType
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
    },
  }),
}));

describe('RepositoryExplorerFilesSection', () => {
  it('renders only directories as interactive and emits selectPath only for them', async () => {
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
