import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { FSNodeType } from '@shared/lib/virtualFileSystem';

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

  const mountButton = async (
    props?: Partial<{
      canChangePath: boolean;
      canDelete: boolean;
      canEditChildren: boolean;
      entryType: FSNodeType;
      showDocumentActions: boolean;
    }>,
  ) => {
    const { default: FSEntryManageMenuButton } = await import('./FSEntryManageMenuButton.vue');

    return mount(FSEntryManageMenuButton, {
      props: {
        path: '/target',
        entryType: FSNodeType.Directory,
        canEditChildren: true,
        canChangePath: true,
        canDelete: true,
        ...props,
      },
    });
  };

  it('renders nested-directory document actions only when enabled by the parent layer', async () => {
    await mountButton({ showDocumentActions: true });

    expect(renderedLabels.value).toEqual([
      'Create directory',
      'Create document',
      'Rename',
      'Import JSON',
      'Remove',
    ]);
  });

  it('keeps current-folder menus free of document actions when the parent disables them', async () => {
    await mountButton({ showDocumentActions: false });

    expect(renderedLabels.value).toEqual(['Create directory', 'Rename', 'Remove']);
  });

  it('uses file-only actions for regular files', async () => {
    await mountButton({ entryType: FSNodeType.File });

    expect(renderedLabels.value).toEqual(['Rename', 'Remove']);
  });

  it('filters actions when capabilities are missing', async () => {
    await mountButton({
      canChangePath: false,
      canDelete: false,
      canEditChildren: false,
      showDocumentActions: true,
    });

    expect(renderedLabels.value).toEqual([]);
  });

  it('exposes the entry-specific menu tooltip', async () => {
    const wrapper = await mountButton();

    expect(wrapper.text()).toContain('options target');
  });

  it('emits create directory when the action is selected', async () => {
    selectedLabel.value = 'Create directory';

    const wrapper = await mountButton();

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('selectCreateDirectory')).toHaveLength(1);
  });

  it('emits create document when the nested-directory action is selected', async () => {
    selectedLabel.value = 'Create document';

    const wrapper = await mountButton({ showDocumentActions: true });

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('selectCreateDocument')).toHaveLength(1);
  });

  it('emits import json when the nested-directory action is selected', async () => {
    selectedLabel.value = 'Import JSON';

    const wrapper = await mountButton({ showDocumentActions: true });

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('selectImportJson')).toHaveLength(1);
  });

  it('emits rename when the action is selected', async () => {
    selectedLabel.value = 'Rename';

    const wrapper = await mountButton();

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('selectRename')).toHaveLength(1);
  });

  it('emits remove when the action is selected', async () => {
    selectedLabel.value = 'Remove';

    const wrapper = await mountButton();

    await wrapper.get('button').trigger('click');
    await flushPromises();

    expect(wrapper.emitted('selectRemove')).toHaveLength(1);
  });
});
