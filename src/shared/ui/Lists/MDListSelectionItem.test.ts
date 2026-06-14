import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MDList from './MDList.vue';
import MDListSelectionItem from './MDListSelectionItem.vue';

const mountSelectionItem = (
  props: Record<string, unknown> = {},
  listProps: Record<string, unknown> = { selectionMode: 'single' },
) =>
  mount(
    {
      components: { MDList, MDListSelectionItem },
      template: `
        <MDList v-bind="listProps">
          <MDListSelectionItem v-bind="itemProps" />
        </MDList>
      `,
      setup: () => ({
        itemProps: { labelText: 'Option', value: 'opt', ...props },
        listProps,
      }),
    },
    { attachTo: document.body },
  );

describe('MDListSelectionItem', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders with role=option, aria-selected, and data-md-list-selection-item inside a selection list', () => {
    const wrapper = mountSelectionItem(
      { value: 'opt' },
      { selectionMode: 'single', modelValue: 'opt' },
    );
    const item = wrapper.get('.md-list-selection-item');

    expect(item.attributes('role')).toBe('option');
    expect(item.attributes('aria-selected')).toBe('true');
    expect(item.attributes('data-md-list-selection-item')).toBe('true');
  });

  it('renders aria-selected=false for an unselected item', () => {
    const wrapper = mountSelectionItem(
      { value: 'other' },
      { selectionMode: 'single', modelValue: 'opt' },
    );
    const item = wrapper.get('.md-list-selection-item');

    expect(item.attributes('aria-selected')).toBe('false');
    expect(item.attributes('aria-disabled')).toBeUndefined();
  });

  it('renders aria-disabled=true and excludes from click selection when disabled', async () => {
    const onUpdateModelValue = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" :model-value="null" @update:model-value="onUpdateModelValue">
            <MDListSelectionItem label-text="Disabled" value="opt" disabled />
          </MDList>
        `,
        setup: () => ({ onUpdateModelValue }),
      },
      { attachTo: document.body },
    );

    const item = wrapper.get('.md-list-selection-item');

    expect(item.attributes('aria-disabled')).toBe('true');

    await item.trigger('click');
    expect(onUpdateModelValue).not.toHaveBeenCalled();
  });

  it('shows a check indicator only for the selected item', () => {
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" model-value="b">
            <MDListSelectionItem label-text="A" value="a" />
            <MDListSelectionItem label-text="B" value="b" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    const items = wrapper.findAll('.md-list-selection-item');
    expect(items[0]?.find('.md-list-selection-item__selection-indicator').text()).toBe('');
    expect(items[1]?.find('.md-list-selection-item__selection-indicator').text()).not.toBe('');
  });

  it('emits a selection update on click', async () => {
    const onUpdateModelValue = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" :model-value="null" @update:model-value="onUpdateModelValue">
            <MDListSelectionItem label-text="Pick me" value="pick" />
          </MDList>
        `,
        setup: () => ({ onUpdateModelValue }),
      },
      { attachTo: document.body },
    );

    await wrapper.get('.md-list-selection-item').trigger('click');
    expect(onUpdateModelValue).toHaveBeenCalledWith('pick');
  });

  it('emits a selection update on Enter keydown', async () => {
    const onUpdateModelValue = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" :model-value="null" @update:model-value="onUpdateModelValue">
            <MDListSelectionItem label-text="Pick me" value="pick" />
          </MDList>
        `,
        setup: () => ({ onUpdateModelValue }),
      },
      { attachTo: document.body },
    );

    await wrapper.get('.md-list-selection-item').trigger('keydown', { key: 'Enter' });
    expect(onUpdateModelValue).toHaveBeenCalledWith('pick');
  });

  it('resolves a two-line layout when supporting text is present', () => {
    const wrapper = mountSelectionItem({ value: 'opt', supportingText: 'Details' });

    expect(wrapper.get('.md-list-selection-item').classes()).toContain(
      'md-list-selection-item_line-count_2',
    );
  });

  it('resolves a three-line layout when overline and supporting text are both present', () => {
    const wrapper = mountSelectionItem({
      value: 'opt',
      overline: 'Category',
      supportingText: 'Detail',
    });

    expect(wrapper.get('.md-list-selection-item').classes()).toContain(
      'md-list-selection-item_line-count_3',
    );
  });

  it('uses div root tag even when the parent list tag is ul (selection lists force div)', () => {
    const wrapper = mountSelectionItem({ value: 'opt' }, { selectionMode: 'single', tag: 'ul' });

    expect(wrapper.get('.md-list-selection-item').element.tagName.toLowerCase()).toBe('div');
  });

  it('adds _selected modifier class when the item is selected', () => {
    const wrapper = mountSelectionItem(
      { value: 'opt' },
      { selectionMode: 'single', modelValue: 'opt' },
    );

    expect(wrapper.get('.md-list-selection-item').classes()).toContain(
      'md-list-selection-item_selected',
    );
  });

  it('does not nest interactive controls inside the selection item', () => {
    const wrapper = mountSelectionItem({ value: 'opt' });
    const item = wrapper.get('.md-list-selection-item');

    expect(item.find('button').exists()).toBe(false);
    expect(item.find('a').exists()).toBe(false);
  });

  it('does not render a state layer when outside any list context', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mount(MDListSelectionItem, {
      attachTo: document.body,
      props: { labelText: 'Orphan', value: 'x' },
    });

    expect(wrapper.find('.md-state-layer').exists()).toBe(false);

    warnSpy.mockRestore();
  });

  it('does not render a state layer when inside a list with selectionMode=none', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mountSelectionItem({ value: 'opt' }, { selectionMode: 'none' });

    expect(wrapper.find('.md-state-layer').exists()).toBe(false);

    warnSpy.mockRestore();
  });

  it('does not set tabindex when outside any list context', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mount(MDListSelectionItem, {
      attachTo: document.body,
      props: { labelText: 'Orphan', value: 'x' },
    });

    expect(wrapper.get('.md-list-selection-item').attributes('tabindex')).toBeUndefined();

    warnSpy.mockRestore();
  });

  it('sets tabindex=-1 when inside an active selection list', () => {
    const wrapper = mountSelectionItem({ value: 'opt' });
    expect(wrapper.get('.md-list-selection-item').attributes('tabindex')).toBe('-1');
  });

  it('warns in development when rendered outside a selection list', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount(MDListSelectionItem, {
      attachTo: document.body,
      props: { labelText: 'Orphan', value: 'x' },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('must be rendered inside an MDList'),
    );

    warnSpy.mockRestore();
  });

  it('renders role=presentation and no aria-selected when outside any list context', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mount(MDListSelectionItem, {
      attachTo: document.body,
      props: { labelText: 'Orphan', value: 'x' },
    });
    const item = wrapper.get('.md-list-selection-item');

    expect(item.attributes('role')).toBe('presentation');
    expect(item.attributes('aria-selected')).toBeUndefined();

    warnSpy.mockRestore();
  });

  it('renders role=presentation and no aria-selected when inside a list with selectionMode=none', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mountSelectionItem({ value: 'opt' }, { selectionMode: 'none' });
    const item = wrapper.get('.md-list-selection-item');

    expect(item.attributes('role')).toBe('presentation');
    expect(item.attributes('aria-selected')).toBeUndefined();

    warnSpy.mockRestore();
  });

  describe('attrs forwarding', () => {
    it('forwards class and data-* to the selection item root', () => {
      const wrapper = mountSelectionItem({ value: 'opt', class: 'custom', 'data-id': '5' });
      const item = wrapper.get('.md-list-selection-item');

      expect(item.classes()).toContain('custom');
      expect(item.attributes('data-id')).toBe('5');
    });

    it('forwards aria-label and title to the selection item root', () => {
      const wrapper = mountSelectionItem({
        value: 'opt',
        'aria-label': 'Color option red',
        title: 'Red',
      });
      const item = wrapper.get('.md-list-selection-item');

      expect(item.attributes('aria-label')).toBe('Color option red');
      expect(item.attributes('title')).toBe('Red');
    });
  });

  it('does not fire a selection update when clicked inside a list with selectionMode=none', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onUpdateModelValue = vi.fn();

    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="none" :model-value="null" @update:model-value="onUpdateModelValue">
            <MDListSelectionItem label-text="Pick me" value="pick" />
          </MDList>
        `,
        setup: () => ({ onUpdateModelValue }),
      },
      { attachTo: document.body },
    );

    await wrapper.get('.md-list-selection-item').trigger('click');
    expect(onUpdateModelValue).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
