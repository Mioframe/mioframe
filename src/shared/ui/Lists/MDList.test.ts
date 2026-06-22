import { mount } from '@vue/test-utils';
import { defineComponent, nextTick, ref } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import MDList from './MDList.vue';
import MDListContainer from './MDListContainer.vue';
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

  it('supports mixing static, single-action, and multi-action MDListItem rows in one list as a Mioframe extension over per-list Material action categories', () => {
    const onAction = vi.fn();
    const wrapper = mount(
      {
        components: { MDList, MDListItem },
        template: `
          <MDList>
            <MDListItem label-text="Static row" mode="static" />
            <MDListItem label-text="Single-action row" mode="single-action" @action="onAction" />
            <MDListItem label-text="Multi-action row" mode="multi-action" @action="onAction">
              <template #trailingAction><button>Menu</button></template>
            </MDListItem>
          </MDList>
        `,
        setup: () => ({ onAction }),
      },
      { attachTo: document.body },
    );

    const rows = wrapper.findAll('[role="listitem"]');
    expect(rows).toHaveLength(3);
    expect(rows[0]?.find('button').exists()).toBe(false);
    expect(rows[1]?.find('button').exists()).toBe(true);
    expect(rows[2]?.findAll('button')).toHaveLength(2);
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

  it('does not treat ArrowLeft or ArrowRight as vertical listbox navigation keys', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" model-value="two">
            <MDListSelectionItem label-text="One" value="one" />
            <MDListSelectionItem label-text="Two" value="two" />
            <MDListSelectionItem label-text="Three" value="three" />
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    await wrapper.vm.$nextTick();

    const options = wrapper.findAll<HTMLElement>('[role="option"]');
    options[1]?.element.focus();

    await options[1]?.trigger('keydown', { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(options[1]?.element);
    expect(options[0]?.element.tabIndex).toBe(-1);
    expect(options[1]?.element.tabIndex).toBe(0);
    expect(options[2]?.element.tabIndex).toBe(-1);

    await options[1]?.trigger('keydown', { key: 'ArrowRight' });
    expect(document.activeElement).toBe(options[1]?.element);
    expect(options[0]?.element.tabIndex).toBe(-1);
    expect(options[1]?.element.tabIndex).toBe(0);
    expect(options[2]?.element.tabIndex).toBe(-1);
  });

  it('resynchronizes tab stops when option state changes after render', async () => {
    const options = ref([
      { label: 'One', value: 'one', disabled: false },
      { label: 'Two', value: 'two', disabled: false },
      { label: 'Three', value: 'three', disabled: true },
    ]);
    const selected = ref('one');

    const wrapper = mount(
      defineComponent({
        components: { MDList, MDListSelectionItem },
        setup() {
          return { options, selected };
        },
        template: `
          <MDList selection-mode="single" :model-value="selected">
            <MDListSelectionItem
              v-for="option in options"
              :key="option.value"
              :label-text="option.label"
              :value="option.value"
              :disabled="option.disabled"
            />
          </MDList>
        `,
      }),
      { attachTo: document.body },
    );

    await nextTick();

    let renderedOptions = wrapper.findAll<HTMLElement>('[role="option"]');
    expect(renderedOptions[0]?.element.tabIndex).toBe(0);
    expect(renderedOptions[1]?.element.tabIndex).toBe(-1);
    expect(renderedOptions[2]?.element.tabIndex).toBe(-1);

    options.value = [
      { label: 'One', value: 'one', disabled: true },
      { label: 'Two', value: 'two', disabled: false },
      { label: 'Three', value: 'three', disabled: true },
    ];
    await nextTick();
    await nextTick();

    renderedOptions = wrapper.findAll<HTMLElement>('[role="option"]');
    expect(renderedOptions[0]?.attributes('aria-disabled')).toBe('true');
    expect(renderedOptions[0]?.element.tabIndex).toBe(-1);
    expect(renderedOptions[1]?.element.tabIndex).toBe(0);
    expect(renderedOptions[2]?.element.tabIndex).toBe(-1);

    options.value = [
      { label: 'One', value: 'one', disabled: false },
      { label: 'Two', value: 'two', disabled: false },
      { label: 'Three', value: 'three', disabled: true },
    ];
    selected.value = 'two';
    await nextTick();
    await nextTick();

    renderedOptions = wrapper.findAll<HTMLElement>('[role="option"]');
    expect(renderedOptions[0]?.attributes('aria-disabled')).toBeUndefined();
    expect(renderedOptions[0]?.element.tabIndex).toBe(-1);
    expect(renderedOptions[1]?.attributes('aria-selected')).toBe('true');
    expect(renderedOptions[1]?.element.tabIndex).toBe(0);
    expect(renderedOptions[2]?.attributes('aria-disabled')).toBe('true');
    expect(renderedOptions[2]?.element.tabIndex).toBe(-1);
    expect(renderedOptions.filter((option) => option.element.tabIndex === 0)).toHaveLength(1);
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

  it('keeps nested selection-list options out of the parent roving focus registry', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" model-value="outer-two">
            <MDListSelectionItem label-text="Outer one" value="outer-one" />
            <MDListSelectionItem label-text="Outer two" value="outer-two" />
            <div class="nested-owner">
              <MDList selection-mode="single" model-value="inner-one">
                <MDListSelectionItem label-text="Inner one" value="inner-one" />
                <MDListSelectionItem label-text="Inner two" value="inner-two" />
              </MDList>
            </div>
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    await nextTick();

    const allOptions = wrapper.findAll<HTMLElement>('[role="option"]');
    const outerOptions = allOptions.slice(0, 2);
    const innerOptions = allOptions.slice(2);

    expect(outerOptions).toHaveLength(2);
    expect(innerOptions).toHaveLength(2);
    expect(outerOptions[0]?.element.tabIndex).toBe(-1);
    expect(outerOptions[1]?.element.tabIndex).toBe(0);

    outerOptions[1]?.element.focus();
    await outerOptions[1]?.trigger('keydown', { key: 'ArrowDown' });

    expect(document.activeElement).toBe(outerOptions[0]?.element);
    expect(innerOptions[0]?.element.tabIndex).toBe(0);
    expect(innerOptions[1]?.element.tabIndex).toBe(-1);
  });

  it('does not let a nested selection list nested inside a parent item move the parent roving focus', async () => {
    const wrapper = mount(
      {
        components: { MDList, MDListSelectionItem },
        template: `
          <MDList selection-mode="single" model-value="outer-two">
            <MDListSelectionItem label-text="Outer one" value="outer-one" />
            <MDListSelectionItem label-text="Outer two" value="outer-two">
              <template #trailing>
                <MDList selection-mode="single" model-value="inner-one">
                  <MDListSelectionItem label-text="Inner one" value="inner-one" />
                  <MDListSelectionItem label-text="Inner two" value="inner-two" />
                </MDList>
              </template>
            </MDListSelectionItem>
          </MDList>
        `,
      },
      { attachTo: document.body },
    );

    await nextTick();

    const allOptions = wrapper.findAll<HTMLElement>('[role="option"]');
    const outerOptions = allOptions.slice(0, 2);
    const innerOptions = allOptions.slice(2);

    expect(outerOptions).toHaveLength(2);
    expect(innerOptions).toHaveLength(2);

    innerOptions[0]?.element.focus();
    await innerOptions[0]?.trigger('keydown', { key: 'ArrowDown' });

    // The inner list must handle its own ArrowDown without the bubbled event also
    // moving the outer list's roving focus or tab stops, even though the inner list is
    // nested inside one of the outer list's own item DOM subtrees.
    expect(document.activeElement).toBe(innerOptions[1]?.element);
    expect(outerOptions[1]?.element.tabIndex).toBe(0);
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

  it('forwards attrs exactly once through MDListContainer', () => {
    const wrapper = mount(MDListContainer, {
      attrs: {
        class: 'compat-list',
        'data-track': 'consumer',
      },
      slots: {
        default: '<div>Row</div>',
      },
    });

    const list = wrapper.get('.md-list');

    expect(list.classes().filter((className) => className === 'compat-list')).toHaveLength(1);
    expect(list.attributes('data-track')).toBe('consumer');
    expect(list.attributes('role')).toBe('list');
  });
});
