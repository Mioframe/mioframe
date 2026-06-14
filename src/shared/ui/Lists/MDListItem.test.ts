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

  it('keeps semantic attrs on static in-list rows when no internal action surface is used', () => {
    const wrapper = mountListItem(
      {
        'aria-label': 'Static settings row',
        title: 'Static row title',
      },
      { inList: true },
    );
    const item = wrapper.get('.md-list-item');

    expect(item.attributes('aria-label')).toBe('Static settings row');
    expect(item.attributes('title')).toBe('Static row title');
  });

  it('forwards action attrs to the internal primary action surface for single-action rows', () => {
    const wrapper = mountListItem(
      {
        mode: 'single-action',
        onAction: vi.fn(),
        'aria-label': 'Open settings',
        title: 'Open settings title',
      },
      { inList: true },
    );
    const item = wrapper.get('.md-list-item');
    const button = item.get('.md-list-item__primary-action');

    expect(item.attributes('aria-label')).toBeUndefined();
    expect(item.attributes('title')).toBeUndefined();
    expect(button.attributes('aria-label')).toBe('Open settings');
    expect(button.attributes('title')).toBe('Open settings title');
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

  it('keeps root attrs and avoids nested controls for multi-action in-list rows', () => {
    const wrapper = mountListItem(
      {
        mode: 'multi-action',
        onAction: vi.fn(),
        id: 'multi-row',
        'data-test-id': 'multi-row-data',
        'aria-label': 'Primary action label',
        title: 'Primary action title',
      },
      {
        inList: true,
        slots: {
          trailingAction: '<button type="button">Secondary</button>',
        },
      },
    );
    const item = wrapper.get('.md-list-item');
    const primaryAction = wrapper.get('.md-list-item__primary-action');

    expect(item.attributes('id')).toBe('multi-row');
    expect(item.attributes('data-test-id')).toBe('multi-row-data');
    expect(primaryAction.attributes('aria-label')).toBe('Primary action label');
    expect(primaryAction.attributes('title')).toBe('Primary action title');
    expect(primaryAction.find('button').exists()).toBe(false);
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

  it('suppresses the internal action surface when placed inside a selection list', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mountListItem(
      { mode: 'single-action', onAction: vi.fn() },
      { inList: true, listProps: { selectionMode: 'single' } },
    );
    const item = wrapper.get('.md-list-item');

    expect(item.find('.md-list-item__primary-action').exists()).toBe(false);
    expect(item.find('button').exists()).toBe(false);
    expect(item.find('a').exists()).toBe(false);

    warnSpy.mockRestore();
  });

  it('suppresses trailing action slot when inside a selection list', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mountListItem(
      { mode: 'multi-action', onAction: vi.fn() },
      {
        inList: true,
        listProps: { selectionMode: 'single' },
        slots: {
          trailingAction: '<button type="button">Edit</button>',
        },
      },
    );

    expect(wrapper.find('.md-list-item__trailing-action').exists()).toBe(false);
    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(false);

    warnSpy.mockRestore();
  });

  it('keeps semantic attrs on suppressed rows inside a selection list', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const wrapper = mountListItem(
      {
        mode: 'multi-action',
        onAction: vi.fn(),
        'aria-label': 'Suppressed row label',
        title: 'Suppressed row title',
      },
      {
        inList: true,
        listProps: { selectionMode: 'single' },
        slots: {
          trailingAction: '<button type="button">Edit</button>',
        },
      },
    );
    const item = wrapper.get('.md-list-item');

    expect(item.attributes('role')).toBe('none');
    expect(item.attributes('aria-label')).toBe('Suppressed row label');
    expect(item.attributes('title')).toBe('Suppressed row title');

    warnSpy.mockRestore();
  });

  // Trailing-area padding fires primary action via CSS geometry: the primary action is
  // position: absolute; inset: 0, and the trailing-action container is pointer-events:
  // none on its background (direct slot content restores pointer-events: auto). In JSDOM
  // CSS hit-testing is not simulated, so this contract is covered by the Playwright
  // browser test 'MDListItem multi-action trailing padding fires primary action' instead.
  it('does not attach a native click handler to the trailing-action container', () => {
    const onAction = vi.fn();
    const wrapper = mountListItem(
      { mode: 'multi-action', onAction },
      {
        inList: true,
        slots: {
          trailingAction: '<button type="button">Edit</button>',
        },
      },
    );

    const trailingEl = wrapper.get('.md-list-item__trailing-action').element;
    // The container should have no onclick attribute; hit-zone routing is CSS-only.
    expect(trailingEl instanceof HTMLElement && trailingEl.onclick).toBeNull();
  });

  describe('standalone multi-action', () => {
    it('renders an internal primary action surface and trailing action when standalone', () => {
      const wrapper = mountListItem(
        { mode: 'multi-action', onAction: vi.fn() },
        {
          inList: false,
          slots: { trailingAction: '<button type="button">Edit</button>' },
        },
      );

      expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(true);
      expect(wrapper.find('.md-list-item__trailing-action').exists()).toBe(true);
      expect(wrapper.find('.md-list-item__trailing-action button').text()).toBe('Edit');
    });

    it('warns in development when standalone multi-action lacks the required slots or handler', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mountListItem({ mode: 'multi-action', onAction: vi.fn() }, { inList: false });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'mode="multi-action" requires either a real primary @action or href',
        ),
      );

      warnSpy.mockRestore();
    });
  });

  describe('attrs forwarding', () => {
    it('forwards class and data-* to root for static standalone item', () => {
      const wrapper = mountListItem({
        class: 'my-custom-class',
        'data-track': 'settings-row',
      });

      const item = wrapper.get('.md-list-item');

      expect(item.classes()).toContain('my-custom-class');
      expect(item.attributes('data-track')).toBe('settings-row');
    });

    it('forwards class and data-* to root for static in-list item', () => {
      const wrapper = mountListItem(
        { class: 'my-in-list-class', 'data-row-id': '42' },
        { inList: true },
      );
      const item = wrapper.get('.md-list-item');

      expect(item.classes()).toContain('my-in-list-class');
      expect(item.attributes('data-row-id')).toBe('42');
    });

    it('forwards aria-label and title to the primary action for single-action in-list items', () => {
      const wrapper = mountListItem(
        {
          mode: 'single-action',
          onAction: vi.fn(),
          'aria-label': 'Open item',
          title: 'Item title',
        },
        { inList: true },
      );
      const action = wrapper.get('.md-list-item__primary-action');

      expect(action.attributes('aria-label')).toBe('Open item');
      expect(action.attributes('title')).toBe('Item title');
    });

    it('root receives non-semantic attrs; action surface receives aria/title for single-action', () => {
      const wrapper = mountListItem(
        {
          mode: 'single-action',
          onAction: vi.fn(),
          id: 'row-1',
          'data-index': '0',
          'aria-label': 'Navigate',
        },
        { inList: true },
      );
      const item = wrapper.get('.md-list-item');
      const action = wrapper.get('.md-list-item__primary-action');

      expect(item.attributes('id')).toBe('row-1');
      expect(item.attributes('data-index')).toBe('0');
      expect(action.attributes('aria-label')).toBe('Navigate');
    });

    it('forwards role override from consumer to root for static standalone items', () => {
      const wrapper = mountListItem({ role: 'option' });

      expect(wrapper.get('.md-list-item').attributes('role')).toBe('option');
    });
  });

  it('does not fire the primary action when clicking inside the trailing action slot', async () => {
    const onAction = vi.fn();
    const wrapper = mountListItem(
      { mode: 'multi-action', onAction },
      {
        inList: true,
        slots: {
          trailingAction: '<button type="button">Edit</button>',
        },
      },
    );

    await wrapper.get('.md-list-item__trailing-action button').trigger('click');

    expect(onAction).not.toHaveBeenCalled();
  });
});
