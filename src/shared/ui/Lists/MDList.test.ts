import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MDList from './MDList.vue';
import MDListItem from './MDListItem.vue';
import MDListSelectionItem from './MDListSelectionItem.vue';

describe('MDList', () => {
  it('renders the list root with the md-list block class', () => {
    const wrapper = mount(MDList, {
      slots: {
        default: '<div>Row</div>',
      },
    });

    expect(wrapper.get('.md-list').classes()).toContain('md-list');
    expect(wrapper.get('.md-list').classes()).toContain('md-list_style_standard');
  });

  it('exposes listbox semantics and controlled selection updates for selection lists', async () => {
    const onUpdateModelValue = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList
            selection-mode="single"
            :model-value="selected"
            @update:model-value="onUpdateModelValue"
          >
            <MDListSelectionItem label-text="One" value="one" />
            <MDListSelectionItem label-text="Two" value="two" />
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
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single">
            <MDListSelectionItem label-text="Has value" value="two" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    const options = wrapper.findAll('[role="option"]');

    expect(options).toHaveLength(1);
    expect(options[0]?.attributes('aria-disabled')).toBeUndefined();
    expect(options[0]?.attributes('aria-selected')).toBe('false');
  });

  it('skips disabled options when assigning tab stops and moving focus', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" model-value="two">
            <MDListSelectionItem label-text="Disabled selected" value="two" disabled />
            <MDListSelectionItem label-text="Enabled one" value="one" />
            <MDListSelectionItem label-text="Disabled two" value="three" disabled />
            <MDListSelectionItem label-text="Enabled four" value="four" />
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
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="multiple" :model-value="[]">
            <MDListSelectionItem label-text="One" value="one" disabled />
            <MDListSelectionItem label-text="Two" value="two" disabled />
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

  it('warns in development when MDListItem is used inside a selection list', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList selection-mode="single">
            <MDListItem label-text="Wrong component" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Use MDListSelectionItem instead'),
    );

    warnSpy.mockRestore();
    document.body.innerHTML = '';
  });

  it('warns in development when tag="ul" is requested for a selection list', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mount(MDList, {
      attachTo: document.body,
      props: {
        selectionMode: 'single',
        tag: 'ul',
      },
      slots: {
        default: '<div>Row</div>',
      },
    });

    expect(wrapper.get('.md-list').element.tagName.toLowerCase()).toBe('div');
    expect(warnSpy).toHaveBeenCalled();
    expect(String(warnSpy.mock.calls[0]?.[0])).toContain(
      'selectionMode lists render as div/listbox containers',
    );

    warnSpy.mockRestore();
  });
});
