import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import MDListItem from './MDListItem.vue';

const mountListItem = (
  props: Record<string, unknown> = {},
  slots: Record<string, string | (() => unknown)> = {},
) =>
  mount(MDListItem, {
    attachTo: document.body,
    props: {
      labelText: 'Settings',
      ...props,
    },
    slots,
  });

describe('MDListItem', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('defaults to a static one-line list item with native list semantics on div hosts', () => {
    const wrapper = mountListItem();

    expect(wrapper.attributes('role')).toBe('listitem');
    expect(wrapper.classes()).toContain('md-list-item_line-count_1');
    expect(wrapper.text()).toContain('Settings');
  });

  it('resolves two-line layout when supporting text is present', () => {
    const wrapper = mountListItem({
      supportingText: 'System preferences',
    });

    expect(wrapper.classes()).toContain('md-list-item_line-count_2');
    expect(wrapper.get('.md-list-item__supporting-text').classes()).toContain(
      'md-list-item__supporting-text_two-line',
    );
  });

  it('uses the explicit three-line layout when requested', () => {
    const wrapper = mountListItem(
      {
        supportingText: 'System preferences',
        lineCount: 3,
      },
      {
        supportingText: 'Two lines of support text become the three-line configuration.',
      },
    );

    expect(wrapper.classes()).toContain('md-list-item_line-count_3');
    expect(wrapper.get('.md-list-item__supporting-text').classes()).toContain(
      'md-list-item__supporting-text_three-line',
    );
  });

  it('emits action from single-action items', async () => {
    const wrapper = mountListItem({
      mode: 'single-action',
    });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('action')).toHaveLength(1);
  });

  it('renders multi-action items with a separate trailing action surface', () => {
    const wrapper = mountListItem(
      {
        mode: 'multi-action',
        supportingText: 'System preferences',
      },
      {
        trailingAction: '<button type="button">Disconnect</button>',
      },
    );

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(true);
    expect(wrapper.get('.md-list-item__trailing-action button').text()).toBe('Disconnect');
    expect(wrapper.get('.md-list-item__primary-action').find('button').exists()).toBe(false);
  });

  it('renders selection controls without a secondary action surface', () => {
    const wrapper = mountListItem(
      {
        mode: 'multi-select',
        selected: true,
      },
      {
        selectionControl: '<span class="selection-control">Selected</span>',
      },
    );

    expect(wrapper.classes()).toContain('md-list-item_selected');
    expect(wrapper.get('.selection-control').text()).toBe('Selected');
    expect(wrapper.find('.md-list-item__trailing-action').exists()).toBe(false);
  });

  it('does not emit action from disabled single-action items', async () => {
    const wrapper = mountListItem({
      mode: 'single-action',
      disabled: true,
    });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('action')).toBeUndefined();
  });

  it('disables anchor-backed single-action items without leaving them in tab order', () => {
    const wrapper = mountListItem({
      mode: 'single-action',
      href: '#target',
      disabled: true,
    });

    expect(wrapper.get('a').attributes('aria-disabled')).toBe('true');
    expect(wrapper.get('a').attributes('tabindex')).toBe('-1');
  });
});
