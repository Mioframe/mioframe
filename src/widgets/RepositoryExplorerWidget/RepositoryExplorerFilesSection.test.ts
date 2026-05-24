/* eslint-disable vue/one-component-per-file -- Focused widget contract test with inline stubs. */
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { FSNodeType } from '@shared/lib/virtualFileSystem';

vi.mock('@entity/fsEntry', () => ({
  FSEntryMDListItem: defineComponent({
    name: 'FSEntryMDListItemStub',
    props: {
      name: { type: String, required: true },
      isButton: { type: Boolean, default: false },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          props.isButton ? 'button' : 'div',
          {
            ...(props.isButton
              ? {
                  type: 'button',
                  onClick: () => {
                    emit('click', props.name);
                  },
                }
              : {}),
          },
          [props.name, slots.trailingIcon?.()],
        );
    },
  }),
}));

vi.mock('@shared/ui/Lists', () => ({
  MDListContainer: defineComponent({
    name: 'MDListContainerStub',
    setup(_props, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
}));

vi.mock('./RepositoryExplorerEntryManageButton.vue', () => ({
  default: defineComponent({
    name: 'RepositoryExplorerEntryManageButtonStub',
    props: {
      showDocumentActions: {
        type: Boolean,
        default: false,
      },
      entryType: {
        type: Number,
        required: true,
      },
    },
    setup(props) {
      return () =>
        h(
          'span',
          props.showDocumentActions
            ? `dir-actions-${props.entryType}`
            : `file-actions-${props.entryType}`,
        );
    },
  }),
}));

describe('RepositoryExplorerFilesSection', () => {
  it('keeps nested directory document actions reachable while files stay file-only', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        visibleFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
          ['note.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
        ],
      },
    });

    expect(wrapper.text()).toContain(`dir-actions-${FSNodeType.Directory}`);
    expect(wrapper.text()).toContain(`file-actions-${FSNodeType.File}`);
  });

  it('renders only directories as interactive and emits selectPath only for them', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: true,
        visibleFileEntries: [
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
        visibleFileEntries: [],
      },
    });

    const visibleWrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        hideAutomergeFiles: false,
        visibleFileEntries: [],
      },
    });

    expect(hiddenWrapper.text()).toContain('Mioframe service files are hidden.');
    expect(visibleWrapper.text()).toContain('Mioframe document files');
    expect(visibleWrapper.text()).not.toContain('Mioframe service files are hidden.');
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after focused inline stubs. */
