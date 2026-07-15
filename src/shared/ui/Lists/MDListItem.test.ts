import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MDList, MDListItem } from '.';

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

  it('uses phrasing-safe standalone single-action anatomy inside the native button root', () => {
    const wrapper = mountListItem({
      mode: 'single-action',
      onAction: vi.fn(),
      overline: 'Category',
      supportingText: 'System preferences',
    });

    const body = wrapper.get('.md-list-item__body');

    expect(body.element.tagName.toLowerCase()).toBe('span');
    expect(wrapper.find('button .md-list-item__body > div').exists()).toBe(false);
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

  it('uses the Material one-line minimum height from the shared sizing contract', () => {
    const wrapper = mountListItem({}, { inList: true });

    expect(wrapper.get('.md-list-item').attributes('style')).toContain(
      '--md-private-list-item-resolved-container-height: 56px',
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

  it('does not warn in development when single-action has no runtime-detectable action listener', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mountListItem({ mode: 'single-action' }, { inList: true });

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining(
        'mode="single-action" requires either an @action listener or an href',
      ),
    );

    warnSpy.mockRestore();
  });

  it('does not warn in development when multi-action has no runtime-detectable primary listener', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mountListItem(
      { mode: 'multi-action' },
      {
        inList: true,
        slots: {
          trailingAction: '<button type="button">Secondary</button>',
        },
      },
    );

    expect(warnSpy).not.toHaveBeenCalledWith(
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

  // Trailing-area padding fires primary action via CSS geometry: the primary action and
  // trailing action are stacked in the same grid cell, and the trailing-action container
  // is pointer-events: none on its background (direct slot content restores
  // pointer-events: auto). In JSDOM CSS hit-testing is not simulated, so this contract is
  // covered by the Playwright browser test 'MDListItem multi-action trailing padding
  // fires primary action' instead.
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

    it('warns in development when standalone multi-action lacks the required trailing action slot', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      mountListItem({ mode: 'multi-action', onAction: vi.fn() }, { inList: false });

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('mode="multi-action" requires a #trailingAction slot'),
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

    it('does not give a standalone static item an implicit role="listitem"', () => {
      const wrapper = mountListItem({});

      expect(wrapper.get('.md-list-item').attributes('role')).toBeUndefined();
    });

    it('still gives an in-list static item role="listitem" when standalone has no implicit role', () => {
      const wrapper = mountListItem({}, { inList: true });

      expect(wrapper.get('.md-list-item').attributes('role')).toBe('listitem');
    });
  });

  describe('disabled action topology (Option A)', () => {
    it('disables the primary action of a disabled single-action in-list row', () => {
      const wrapper = mountListItem(
        { mode: 'single-action', disabled: true, onAction: vi.fn() },
        { inList: true },
      );
      const action = wrapper.get<HTMLButtonElement>('button.md-list-item__primary-action');

      expect(action.element.disabled).toBe(true);
    });

    it('disables the primary action and makes the trailing action inert for a disabled multi-action row', () => {
      const wrapper = mountListItem(
        { mode: 'multi-action', disabled: true, onAction: vi.fn() },
        {
          inList: true,
          slots: { trailingAction: '<button type="button">Edit</button>' },
        },
      );
      const primaryAction = wrapper.get<HTMLButtonElement>('button.md-list-item__primary-action');
      const trailingWrapper = wrapper.get('.md-list-item__trailing-action');

      expect(primaryAction.element.disabled).toBe(true);
      // Option A: the whole row topology is disabled, so the consumer-owned trailing
      // control is made inert by the row rather than left interactive.
      expect(trailingWrapper.attributes('inert')).toBeDefined();
    });

    it('keeps the trailing action interactive for an enabled multi-action row', () => {
      const wrapper = mountListItem(
        { mode: 'multi-action', onAction: vi.fn() },
        {
          inList: true,
          slots: { trailingAction: '<button type="button">Edit</button>' },
        },
      );
      const trailingWrapper = wrapper.get('.md-list-item__trailing-action');

      expect(trailingWrapper.attributes('inert')).toBeUndefined();
    });

    it('makes a standalone disabled multi-action trailing action inert', () => {
      const wrapper = mountListItem(
        { mode: 'multi-action', disabled: true, onAction: vi.fn() },
        { inList: false, slots: { trailingAction: '<button type="button">Edit</button>' } },
      );
      const trailingWrapper = wrapper.get('.md-list-item__trailing-action');

      expect(trailingWrapper.attributes('inert')).toBeDefined();
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

  describe('dragged state', () => {
    it('activates root and nested state-layer dragged state for an in-list single-action row via the dragged prop', () => {
      const wrapper = mountListItem(
        { mode: 'single-action', dragged: true, onAction: vi.fn() },
        { inList: true },
      );
      const item = wrapper.get('.md-list-item');
      const stateLayer = wrapper.get('.md-state-layer');

      expect(item.classes()).toContain('md-state_dragged');
      expect(stateLayer.classes()).toContain('md-state_dragged');
    });

    it('activates root and nested state-layer dragged state for an in-list multi-action row with a trailing action via the dragged prop', () => {
      const wrapper = mountListItem(
        { mode: 'multi-action', dragged: true, onAction: vi.fn() },
        {
          inList: true,
          slots: { trailingAction: '<button type="button">Edit</button>' },
        },
      );
      const item = wrapper.get('.md-list-item');
      const stateLayer = wrapper.get('.md-list-item__primary-action .md-state-layer');

      expect(item.classes()).toContain('md-state_dragged');
      expect(stateLayer.classes()).toContain('md-state_dragged');
    });

    it('does not render an active state-layer dragged overlay for a disabled action row even when dragged is true', () => {
      const wrapper = mountListItem(
        { mode: 'single-action', disabled: true, dragged: true, onAction: vi.fn() },
        { inList: true },
      );
      const stateLayer = wrapper.get('.md-state-layer');

      expect(stateLayer.classes()).not.toContain('md-state_dragged');
      expect(stateLayer.classes()).toContain('md-state_disabled');
    });

    it('still sets and clears the effective dragged state from local dragstart/dragend events', async () => {
      const wrapper = mountListItem(
        { mode: 'single-action', draggable: true, onAction: vi.fn() },
        { inList: true },
      );
      const item = wrapper.get('.md-list-item');
      const stateLayer = wrapper.get('.md-state-layer');

      expect(item.classes()).not.toContain('md-state_dragged');

      await item.trigger('dragstart');

      expect(item.classes()).toContain('md-state_dragged');
      expect(stateLayer.classes()).toContain('md-state_dragged');

      await item.trigger('dragend');

      expect(item.classes()).not.toContain('md-state_dragged');
      expect(stateLayer.classes()).not.toContain('md-state_dragged');
    });

    it('does not fire the primary action when clicking inside the trailing action slot of a dragged multi-action row', async () => {
      const onAction = vi.fn();
      const wrapper = mountListItem(
        { mode: 'multi-action', dragged: true, onAction },
        {
          inList: true,
          slots: { trailingAction: '<button type="button">Edit</button>' },
        },
      );

      await wrapper.get('.md-list-item__trailing-action button').trigger('click');

      expect(onAction).not.toHaveBeenCalled();
    });
  });

  // Narrow structural type for the exposed instance this suite actually needs, instead of the
  // full `InstanceType<typeof MDListItem>` component type.
  interface ExposedMDListItem {
    getPrimaryActionElement: () => HTMLElement | null;
  }

  describe('getPrimaryActionElement', () => {
    // Mirrors the real consumer mechanism (a ref resolving the exposed instance via
    // Vue's own expose proxy) instead of @vue/test-utils' `wrapper.vm`, which cannot
    // resolve `defineExpose` members with this project's Vue build. A function ref
    // captured in a plain closure sidesteps that entirely.
    const mountWithItemRef = (itemProps: Record<string, unknown>) => {
      let itemRef: ExposedMDListItem | null = null;
      const wrapper = mount(
        {
          components: { MDList, MDListItem },
          template: `<MDList><MDListItem :ref="setItemRef" v-bind="itemProps" /></MDList>`,
          setup: () => ({
            itemProps,
            setItemRef: (el: ExposedMDListItem | null) => {
              itemRef = el;
            },
          }),
        },
        { attachTo: document.body },
      );

      return { wrapper, getItemRef: () => itemRef };
    };

    // Same ref-capture mechanism as `mountWithItemRef`, but standalone (no ancestor `MDList`),
    // for the standalone single-action topologies where the root element is the interactive
    // surface.
    const mountStandaloneWithItemRef = (itemProps: Record<string, unknown>) => {
      let itemRef: ExposedMDListItem | null = null;
      const wrapper = mount(
        {
          components: { MDListItem },
          template: `<MDListItem :ref="setItemRef" v-bind="itemProps" />`,
          setup: () => ({
            itemProps,
            setItemRef: (el: ExposedMDListItem | null) => {
              itemRef = el;
            },
          }),
        },
        { attachTo: document.body },
      );

      return { wrapper, getItemRef: () => itemRef };
    };

    it('returns the primary action element for an in-list single-action row', () => {
      const { wrapper, getItemRef } = mountWithItemRef({
        labelText: 'Settings',
        mode: 'single-action',
        onAction: vi.fn(),
      });
      const button = wrapper.get('.md-list-item__primary-action').element;
      const itemRef = getItemRef();

      if (!itemRef) {
        throw new Error('itemRef did not resolve');
      }

      expect(itemRef.getPrimaryActionElement()).toBe(button);
    });

    it('returns null for a static row with no primary action surface', () => {
      const { getItemRef } = mountWithItemRef({ labelText: 'Settings' });
      const itemRef = getItemRef();

      if (!itemRef) {
        throw new Error('itemRef did not resolve');
      }

      expect(itemRef.getPrimaryActionElement()).toBeNull();
    });

    it('returns the root button element for a standalone single-action button', () => {
      const { wrapper, getItemRef } = mountStandaloneWithItemRef({
        labelText: 'Settings',
        mode: 'single-action',
        onAction: vi.fn(),
      });
      const itemRef = getItemRef();

      if (!itemRef) {
        throw new Error('itemRef did not resolve');
      }

      expect(itemRef.getPrimaryActionElement()).toBe(wrapper.element);
      expect(wrapper.element.tagName.toLowerCase()).toBe('button');
    });

    it('returns the root anchor element for a standalone single-action link', () => {
      const { wrapper, getItemRef } = mountStandaloneWithItemRef({
        labelText: 'Settings',
        mode: 'single-action',
        href: '/settings',
      });
      const itemRef = getItemRef();

      if (!itemRef) {
        throw new Error('itemRef did not resolve');
      }

      expect(itemRef.getPrimaryActionElement()).toBe(wrapper.element);
      expect(wrapper.element.tagName.toLowerCase()).toBe('a');
    });
  });
});
