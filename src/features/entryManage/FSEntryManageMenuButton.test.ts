import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import type { NonEmptyMenuButtonList } from '@shared/ui/Menu';

const { selectedLabel, renderedLabels } = vi.hoisted(() => ({
  selectedLabel: { value: 'Import JSON' },
  renderedLabels: { value: new Array<string>() },
}));

vi.mock('@shared/ui/Menu', () => ({
  MDContextMenuButton: defineComponent({
    name: 'MDContextMenuButtonStub',
    props: {
      btns: {
        type: Array,
        required: true,
      },
      tooltip: {
        type: String,
        required: true,
      },
    },
    emits: ['click'],
    setup(props, { emit }) {
      return () => {
        renderedLabels.value = props.btns
          .filter(
            (button): button is { label: string } => typeof button === 'object' && button !== null,
          )
          .map((button) => button.label);

        return h(
          'button',
          {
            type: 'button',
            onClick: () => {
              emit(
                'click',
                props.btns.find(
                  (button) =>
                    typeof button === 'object' &&
                    button !== null &&
                    'label' in button &&
                    button.label === selectedLabel.value,
                ) ?? props.btns[0],
              );
            },
          },
          props.tooltip,
        );
      };
    },
  }),
  defineMenuButtonList: <T>(buttons: T[]) => buttons,
}));

describe('FSEntryManageMenuButton', () => {
  beforeEach(() => {
    selectedLabel.value = 'Import JSON';
    renderedLabels.value = [];
  });

  const mountButton = async (actions: NonEmptyMenuButtonList) => {
    const { default: FSEntryManageMenuButton } = await import('./FSEntryManageMenuButton.vue');
    return mount(FSEntryManageMenuButton, {
      props: {
        path: '/target',
        actions,
      },
    });
  };

  it('renders the provided action list', async () => {
    await mountButton([
      { key: 'createDirectory', label: 'Create directory', symbolName: 'create_new_folder' },
      { key: 'createDocument', label: 'Create document', symbolName: 'edit_document' },
      { key: 'rename', label: 'Rename', symbolName: 'edit' },
      { key: 'importJson', label: 'Import JSON', symbolName: 'file_copy' },
      { key: 'remove', label: 'Remove', symbolName: 'delete' },
    ] as const);

    expect(renderedLabels.value).toEqual([
      'Create directory',
      'Create document',
      'Rename',
      'Import JSON',
      'Remove',
    ]);
  });

  it('renders only the actions provided — no internal action derivation', async () => {
    await mountButton([
      { key: 'createDirectory', label: 'Create directory', symbolName: 'create_new_folder' },
      { key: 'rename', label: 'Rename', symbolName: 'edit' },
      { key: 'remove', label: 'Remove', symbolName: 'delete' },
    ] as const);

    expect(renderedLabels.value).toEqual(['Create directory', 'Rename', 'Remove']);
  });

  it('exposes the entry-specific menu tooltip', async () => {
    const wrapper = await mountButton([
      { key: 'rename', label: 'Rename', symbolName: 'edit' },
    ] as const);

    expect(wrapper.text()).toContain('options target');
  });

  it('emits create directory when the action is selected', async () => {
    selectedLabel.value = 'Create directory';

    const wrapper = await mountButton([
      { key: 'createDirectory', label: 'Create directory', symbolName: 'create_new_folder' },
    ] as const);

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('selectCreateDirectory')).toHaveLength(1);
  });

  it('emits create document when the action is selected', async () => {
    selectedLabel.value = 'Create document';

    const wrapper = await mountButton([
      { key: 'createDocument', label: 'Create document', symbolName: 'edit_document' },
    ] as const);

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('selectCreateDocument')).toHaveLength(1);
  });

  it('emits import json when the action is selected', async () => {
    selectedLabel.value = 'Import JSON';

    const wrapper = await mountButton([
      { key: 'importJson', label: 'Import JSON', symbolName: 'file_copy' },
    ] as const);

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('selectImportJson')).toHaveLength(1);
  });

  it('emits rename when the action is selected', async () => {
    selectedLabel.value = 'Rename';

    const wrapper = await mountButton([
      { key: 'rename', label: 'Rename', symbolName: 'edit' },
    ] as const);

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('selectRename')).toHaveLength(1);
  });

  it('emits remove when the action is selected', async () => {
    selectedLabel.value = 'Remove';

    const wrapper = await mountButton([
      { key: 'remove', label: 'Remove', symbolName: 'delete' },
    ] as const);

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('selectRemove')).toHaveLength(1);
  });
});
