import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MDList from './MDList.vue';
import MDListOption from './MDListOption.vue';

const mountOption = (
  props: Record<string, unknown> = {},
  listProps: Record<string, unknown> = { selectionMode: 'single' },
) =>
  mount(
    {
      components: { MDList, MDListOption },
      template: `
        <MDList v-bind="listProps">
          <MDListOption v-bind="itemProps" />
        </MDList>
      `,
      setup: () => ({
        itemProps: { labelText: 'Option', value: 'opt', ...props },
        listProps,
      }),
    },
    { attachTo: document.body },
  );

describe('MDListOption', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders with role=option, aria-selected, and data-md-list-option inside a selection list', () => {
    const wrapper = mountOption({ value: 'opt' }, { selectionMode: 'single', modelValue: 'opt' });
    const option = wrapper.get('.md-list-option');

    expect(option.attributes('role')).toBe('option');
    expect(option.attributes('aria-selected')).toBe('true');
    expect(option.attributes('data-md-list-option')).toBe('true');
  });

  it('renders aria-selected=false for an unselected option', () => {
    const wrapper = mountOption({ value: 'other' }, { selectionMode: 'single', modelValue: 'opt' });
    const option = wrapper.get('.md-list-option');

    expect(option.attributes('aria-selected')).toBe('false');
    expect(option.attributes('aria-disabled')).toBeUndefined();
  });

  it('renders aria-disabled=true and excludes from click selection when disabled', async () => {
    const onUpdateModelValue = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListOption },
        template: `
          <MDList selection-mode="single" :model-value="null" @update:model-value="onUpdateModelValue">
            <MDListOption label-text="Disabled" value="opt" disabled />
          </MDList>
        `,
        setup: () => ({ onUpdateModelValue }),
      },
      { attachTo: document.body },
    );

    const option = wrapper.get('.md-list-option');

    expect(option.attributes('aria-disabled')).toBe('true');

    await option.trigger('click');
    expect(onUpdateModelValue).not.toHaveBeenCalled();
  });

  it('shows a check indicator only for the selected option', () => {
    const wrapper = mount(
      {
        components: { MDList, MDListOption },
        template: `
          <MDList selection-mode="single" model-value="b">
            <MDListOption label-text="A" value="a" />
            <MDListOption label-text="B" value="b" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    const options = wrapper.findAll('.md-list-option');
    expect(options[0]?.find('.md-list-option__selection-indicator').text()).toBe('');
    expect(options[1]?.find('.md-list-option__selection-indicator').text()).not.toBe('');
  });

  it('emits a selection update on click', async () => {
    const onUpdateModelValue = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListOption },
        template: `
          <MDList selection-mode="single" :model-value="null" @update:model-value="onUpdateModelValue">
            <MDListOption label-text="Pick me" value="pick" />
          </MDList>
        `,
        setup: () => ({ onUpdateModelValue }),
      },
      { attachTo: document.body },
    );

    await wrapper.get('.md-list-option').trigger('click');
    expect(onUpdateModelValue).toHaveBeenCalledWith('pick');
  });

  it('emits a selection update on Enter keydown', async () => {
    const onUpdateModelValue = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListOption },
        template: `
          <MDList selection-mode="single" :model-value="null" @update:model-value="onUpdateModelValue">
            <MDListOption label-text="Pick me" value="pick" />
          </MDList>
        `,
        setup: () => ({ onUpdateModelValue }),
      },
      { attachTo: document.body },
    );

    await wrapper.get('.md-list-option').trigger('keydown', { key: 'Enter' });
    expect(onUpdateModelValue).toHaveBeenCalledWith('pick');
  });

  it('resolves a two-line layout when supporting text is present', () => {
    const wrapper = mountOption({ value: 'opt', supportingText: 'Details' });

    expect(wrapper.get('.md-list-option').classes()).toContain('md-list-option_line-count_2');
  });

  it('resolves a three-line layout when overline and supporting text are both present', () => {
    const wrapper = mountOption({ value: 'opt', overline: 'Category', supportingText: 'Detail' });

    expect(wrapper.get('.md-list-option').classes()).toContain('md-list-option_line-count_3');
  });

  it('uses li root tag when the parent list tag is ul', () => {
    const wrapper = mountOption({ value: 'opt' }, { selectionMode: 'single', tag: 'ul' });

    expect(wrapper.get('.md-list-option').element.tagName.toLowerCase()).toBe('div');
  });

  it('adds _selected modifier class when the option is selected', () => {
    const wrapper = mountOption({ value: 'opt' }, { selectionMode: 'single', modelValue: 'opt' });

    expect(wrapper.get('.md-list-option').classes()).toContain('md-list-option_selected');
  });

  it('does not nest interactive controls inside the option', () => {
    const wrapper = mountOption({ value: 'opt' });
    const option = wrapper.get('.md-list-option');

    expect(option.find('button').exists()).toBe(false);
    expect(option.find('a').exists()).toBe(false);
  });

  it('warns in development when rendered outside a selection list', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount(MDListOption, {
      attachTo: document.body,
      props: { labelText: 'Orphan', value: 'x' },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('must be rendered inside an MDList'),
    );

    warnSpy.mockRestore();
  });
});
