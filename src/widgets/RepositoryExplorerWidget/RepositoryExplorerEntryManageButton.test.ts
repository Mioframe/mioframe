import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';
import { defineMenuButtonList } from '@shared/ui/Menu';

const capturedProps = vi.hoisted(() => ({
  path: '',
  actionsLength: 0,
}));

vi.mock('@feature/entryManage', () => ({
  FSEntryManageMenuButton: defineComponent({
    name: 'FSEntryManageMenuButtonStub',
    props: {
      path: { type: String, required: true },
      actions: { type: Array, required: true },
    },
    setup(props) {
      return () => {
        capturedProps.path = props.path;
        capturedProps.actionsLength = props.actions.length;
        return h('button', { 'data-testid': 'entry-manage-menu-button', type: 'button' }, 'Menu');
      };
    },
  }),
}));

const mountButton = async () => {
  const { default: RepositoryExplorerEntryManageButton } =
    await import('./RepositoryExplorerEntryManageButton.vue');
  return mount(RepositoryExplorerEntryManageButton, {
    props: {
      path: '/test/entry',
      actions: defineMenuButtonList([
        { key: 'rename', label: 'Rename', symbolName: 'edit' },
        { key: 'remove', label: 'Remove', symbolName: 'delete' },
      ] as const),
    },
  });
};

describe('RepositoryExplorerEntryManageButton', () => {
  it('uses the menu button as its real root and forwards the pre-derived action list', async () => {
    const wrapper = await mountButton();

    expect(wrapper.find('[data-testid="entry-manage-menu-button"]').exists()).toBe(true);
    expect(wrapper.find('.repository-explorer-entry-manage-button').exists()).toBe(true);
    expect(wrapper.html()).not.toContain('<span');
    expect(capturedProps.path).toBe('/test/entry');
    expect(capturedProps.actionsLength).toBe(2);
  });

  it('does not call useFSNodeStat or derive actions internally', async () => {
    const wrapper = await mountButton();

    expect(wrapper.find('[data-testid="entry-manage-menu-button"]').exists()).toBe(true);
    expect(capturedProps.actionsLength).toBe(2);
  });
});
