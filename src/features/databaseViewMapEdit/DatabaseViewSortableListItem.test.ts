import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateViewId } from '@shared/lib/databaseDocument';
import { ReorderSurface } from '@shared/lib/reorder';
import { MDList } from '@shared/ui/Lists';
import { h } from 'vue';
import DatabaseViewSortableListItem from './DatabaseViewSortableListItem.vue';

const FAKE_VIEW_ID = generateViewId();

const mountRow = (props: Record<string, unknown> = {}, slots: Record<string, () => unknown> = {}) =>
  mount(
    {
      components: { ReorderSurface, MDList, DatabaseViewSortableListItem },
      template: `
        <ReorderSurface :item-ids="[rowProps.viewId]">
          <MDList>
            <DatabaseViewSortableListItem v-bind="rowProps" @action="onAction">
              <template v-if="$slots.leading" #leading><slot name="leading" /></template>
              <template v-if="$slots.trailingAction" #trailingAction><slot name="trailingAction" /></template>
            </DatabaseViewSortableListItem>
          </MDList>
        </ReorderSurface>
      `,
      setup: () => ({
        rowProps: {
          viewId: FAKE_VIEW_ID,
          index: 0,
          labelText: 'My View',
          mode: 'single-action',
          ...props,
        },
        onAction: props.onAction ?? vi.fn(),
      }),
    },
    { attachTo: document.body, slots },
  );

describe('DatabaseViewSortableListItem', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders MDListItem as its only root with no wrapper element', () => {
    const wrapper = mountRow();

    expect(wrapper.findComponent(DatabaseViewSortableListItem).element.classList).toContain(
      'md-list-item',
    );
    expect(wrapper.find('.db-view-sortable-list-item').exists()).toBe(true);
  });

  it('forwards labelText to MDListItem', () => {
    const wrapper = mountRow();

    expect(wrapper.text()).toContain('My View');
  });

  it('emits action when the primary action is clicked', async () => {
    const onAction = vi.fn();
    const wrapper = mountRow({ onAction });

    await wrapper.get('.md-list-item__primary-action').trigger('click');

    expect(onAction).toHaveBeenCalledOnce();
  });

  it('forwards aria-current to the primary action', () => {
    const wrapper = mountRow({ ariaCurrent: 'true' });

    expect(wrapper.get('.md-list-item__primary-action').attributes('aria-current')).toBe('true');
  });

  it('renders multi-action rows with the forwarded trailingAction slot', () => {
    const wrapper = mountRow(
      { mode: 'multi-action' },
      { trailingAction: () => h('button', { type: 'button', 'data-testid': 'trailing' }, 'Edit') },
    );

    expect(wrapper.find('[data-testid="trailing"]').exists()).toBe(true);
  });

  it('forwards the leading slot', () => {
    const wrapper = mountRow(
      {},
      { leading: () => h('span', { 'data-testid': 'leading' }, 'icon') },
    );

    expect(wrapper.find('[data-testid="leading"]').exists()).toBe(true);
  });
});
