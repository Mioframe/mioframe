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
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            onClick: () => {
              emit('click');
            },
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
        visibleFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
          ['note.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
        ],
      },
    });

    expect(wrapper.text()).toContain(`dir-actions-${FSNodeType.Directory}`);
    expect(wrapper.text()).toContain(`file-actions-${FSNodeType.File}`);
  });

  it('emits selectPath only for nested directories', async () => {
    const { default: RepositoryExplorerFilesSection } =
      await import('./RepositoryExplorerFilesSection.vue');

    const wrapper = mount(RepositoryExplorerFilesSection, {
      props: {
        directoryPath: '/repo',
        visibleFileEntries: [
          ['Nested', { type: FSNodeType.Directory, capabilities: {}, description: 'dir' }],
          ['note.txt', { type: FSNodeType.File, capabilities: {}, description: 'file' }],
        ],
      },
    });

    const buttons = wrapper.findAll('button');
    await buttons[0]?.trigger('click');
    await buttons[1]?.trigger('click');

    expect(wrapper.emitted('selectPath')).toEqual([['/repo/Nested']]);
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after focused inline stubs. */
