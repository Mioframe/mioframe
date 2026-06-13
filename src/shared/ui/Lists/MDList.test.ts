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

  it('keeps selection-list DOM safe when an item is missing a value', () => {
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList selection-mode="single">
            <MDListItem label-text="Missing value" />
            <MDListItem label-text="Has value" value="two" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    const options = wrapper.findAll('[role="option"]');

    expect(options).toHaveLength(2);
    expect(options[0]?.attributes('aria-disabled')).toBe('true');
    expect(options[0]?.attributes('aria-selected')).toBe('false');
    expect(options[1]?.attributes('aria-disabled')).toBeUndefined();
  });

  it('skips disabled options when assigning tab stops and moving focus', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList selection-mode="single" model-value="two">
            <MDListItem label-text="Disabled selected" value="two" disabled />
            <MDListItem label-text="Enabled one" value="one" />
            <MDListItem label-text="Disabled two" value="three" disabled />
            <MDListItem label-text="Enabled four" value="four" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    await wrapper.vm.$nextTick();

    const options = wrapper.findAll<HTMLElement>('[role="option"]');

    expect(options[0]?.element.tabIndex).toBe(-1);
    expect(options[1]?.element.tabIndex).toBe(0);
    expect(options[2]?.element.tabIndex).toBe(-1);
    expect(options[3]?.element.tabIndex).toBe(-1);

    options[1]?.element.focus();
    await options[1]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[3]?.element);

    await options[3]?.trigger('keydown', { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[1]?.element);

    await options[1]?.trigger('keydown', { key: 'End' });
    expect(document.activeElement).toBe(options[3]?.element);

    await options[3]?.trigger('keydown', { key: 'Home' });
    expect(document.activeElement).toBe(options[1]?.element);
  });

  it('leaves all options out of the tab order when every option is disabled', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList selection-mode="multiple" :model-value="[]">
            <MDListItem label-text="One" value="one" disabled />
            <MDListItem label-text="Two" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    await wrapper.vm.$nextTick();

    for (const option of wrapper.findAll<HTMLElement>('[role="option"]')) {
      expect(option.element.tabIndex).toBe(-1);
      expect(option.attributes('aria-disabled')).toBe('true');
    }
  });
});
