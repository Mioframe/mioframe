import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MDList from './MDList.vue';
import MDListItem from './MDListItem.vue';

const mountListItem = (
  props: Record<string, unknown> = {},
  options: {
    inList?: boolean;
    listProps?: Record<string, unknown>;
    slots?: Record<string, string | (() => unknown)>;
  } = {},
) => {
  const { inList = false, listProps = {}, slots = {} } = options;

  if (!inList) {
    return mount(MDListItem, {
      attachTo: document.body,
      props: {
        labelText: 'Settings',
        ...props,
      },
      slots,
    });
  }

  return mount(
    {
      components: { MDList, MDListItem },
      template: `
        <MDList v-bind="listProps">
          <MDListItem v-bind="itemProps">
            <template v-if="$slots.leading" #leading><slot name="leading" /></template>
            <template v-if="$slots.trailing" #trailing><slot name="trailing" /></template>
            <template v-if="$slots.trailingAction" #trailingAction><slot name="trailingAction" /></template>
            <template v-if="$slots.supportingText" #supportingText><slot name="supportingText" /></template>
          </MDListItem>
        </MDList>
      `,
      setup: () => ({
        itemProps: {
          labelText: 'Settings',
          ...props,
        },
        listProps,
      }),
    },
    {
      attachTo: document.body,
      slots,
    },
  );
};

describe('MDListItem', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a static list item wrapper with list semantics inside MDList', () => {
    const wrapper = mountListItem({}, { inList: true });
    const item = wrapper.get('.md-list-item');

    expect(wrapper.get('.md-list').attributes('role')).toBe('list');
    expect(item.attributes('role')).toBe('listitem');
    expect(item.find('button').exists()).toBe(false);
    expect(item.text()).toContain('Settings');
  });

  it('renders single-action rows as listitem wrappers with an internal button inside MDList', () => {
    const wrapper = mountListItem({ mode: 'single-action', onAction: vi.fn() }, { inList: true });
    const item = wrapper.get('.md-list-item');
    const button = item.get('button.md-list-item__primary-action');

    expect(item.attributes('role')).toBe('listitem');
    expect(button.element.tagName.toLowerCase()).toBe('button');
    expect(item.element.tagName.toLowerCase()).toBe('div');
  });

  it('renders multi-action rows with sibling primary and trailing action surfaces inside MDList', () => {
    const wrapper = mountListItem(
      { mode: 'multi-action', onAction: vi.fn() },
      {
        inList: true,
        slots: {
          trailingAction: '<button type="button">Secondary</button>',
        },
      },
    );

    expect(wrapper.get('.md-list-item').attributes('role')).toBe('listitem');
    expect(wrapper.get('.md-list-item__primary-action').find('button').exists()).toBe(false);
    expect(wrapper.get('.md-list-item__trailing-action button').text()).toBe('Secondary');
  });

  it('uses li wrappers when the list tag is ul', () => {
    const wrapper = mountListItem({}, { inList: true, listProps: { tag: 'ul' } });
    const item = wrapper.get('.md-list-item');

    expect(wrapper.get('ul').attributes('role')).toBeUndefined();
    expect(item.element.tagName.toLowerCase()).toBe('li');
    expect(item.attributes('role')).toBeUndefined();
  });

  it('keeps standalone single-action items root-focusable for non-list consumers', () => {
    const wrapper = mountListItem({ mode: 'single-action', onAction: vi.fn() });

    expect(wrapper.element.tagName.toLowerCase()).toBe('button');
  });

  it('does not render option semantics or a selection indicator without a selection list context', () => {
    const wrapper = mountListItem({}, { inList: true });
    const item = wrapper.get('.md-list-item');

    expect(item.attributes('role')).toBe('listitem');
    expect(item.attributes('aria-selected')).toBeUndefined();
    expect(item.find('.md-list-item__selection-indicator').exists()).toBe(false);
  });

  it('resolves a two-line layout when supporting text is present', () => {
    const wrapper = mountListItem({ supportingText: 'System preferences' }, { inList: true });

    expect(wrapper.get('.md-list-item').classes()).toContain('md-list-item_line-count_2');
    expect(wrapper.get('.md-list-item__supporting-text').classes()).toContain(
      'md-list-item__supporting-text_two-line',
    );
  });

  it('resolves a three-line layout when overline and supporting text are present', () => {
    const wrapper = mountListItem(
      {
        overline: 'Category',
        supportingText: 'Two supporting lines become the three-line configuration.',
      },
      {
        inList: true,
        slots: {
          supportingText: 'Two supporting lines become the three-line configuration.',
        },
      },
    );

    expect(wrapper.get('.md-list-item').classes()).toContain('md-list-item_line-count_3');
    expect(wrapper.get('.md-list-item__supporting-text').classes()).toContain(
      'md-list-item__supporting-text_three-line',
    );
  });

  it('warns in development when single-action has no action listener or href', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mountListItem({ mode: 'single-action' }, { inList: true });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining(
        'mode="single-action" requires either an @action listener or an href',
      ),
    );

    warnSpy.mockRestore();
  });

  it('warns in development when multi-action has no secondary action slot', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mountListItem({ mode: 'multi-action', onAction: vi.fn() }, { inList: true });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('mode="multi-action" requires either a real primary @action or href'),
    );

    warnSpy.mockRestore();
  });

  it('warns in development when used inside a selection list', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mountListItem({}, { inList: true, listProps: { selectionMode: 'single' } });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Use MDListSelectionItem instead'),
    );

    warnSpy.mockRestore();
  });

  it('renders role=none instead of listitem when placed inside a selection list to prevent invalid listbox>listitem DOM', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mountListItem({}, { inList: true, listProps: { selectionMode: 'single' } });
    const item = wrapper.get('.md-list-item');

    expect(item.attributes('role')).toBe('none');
    expect(item.attributes('aria-selected')).toBeUndefined();

    warnSpy.mockRestore();
  });
});
