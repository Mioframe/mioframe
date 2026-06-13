import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MDList from './MDList.vue';
import MDListItem from './MDListItem.vue';

describe('MDList', () => {
  it('uses the Material variant prop instead of density naming', () => {
    const wrapper = mount(MDList, {
      props: {
        variant: 'expressive',
      },
      slots: {
        default: '<div>Row</div>',
      },
    });

    expect(wrapper.get('.md-list').classes()).toContain('md-list_variant_expressive');
  });

  it('exposes listbox semantics and controlled selection updates for selection lists', async () => {
    const onUpdateModelValue = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList
            selection-mode="single"
            :model-value="selected"
            @update:model-value="onUpdateModelValue"
          >
            <MDListItem label-text="One" value="one" />
            <MDListItem label-text="Two" value="two" />
          </MDList>
        `,
        setup: () => ({
          onUpdateModelValue,
          selected: 'two',
        }),
      },
      { attachTo: document.body },
    );

    const list = wrapper.get('.md-list');
    const options = wrapper.findAll('[role="option"]');

    expect(list.attributes('role')).toBe('listbox');
    expect(options).toHaveLength(2);
    expect(options[1]?.attributes('aria-selected')).toBe('true');

    expect(options[0]).toBeDefined();
    await options[0]?.trigger('click');

    expect(onUpdateModelValue).toHaveBeenCalledWith('one');
  });
});
