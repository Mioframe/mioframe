import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent } from 'vue';
import { REORDER_IGNORE_ATTRIBUTE, REORDER_ITEM_ATTRIBUTE } from './constants';
import { vReorderIgnore, vReorderItem } from './reorderDirectives';

/* eslint-disable vue/one-component-per-file -- test fixtures: the nested component-root
   chain under test (wrapper component -> leaf component -> element) requires several
   tiny local components in one spec file */

/** Leaf row rendering a single HTMLElement root, like a shared Material list item. */
const LeafRow = defineComponent({
  name: 'LeafRow',
  template: '<div class="leaf-row"><button type="button">action</button></div>',
});

/**
 * Feature row whose root is another component, like
 * `DatabaseSortingListItem` wrapping `MDListItem`. The directive must reach the real
 * rendered root element through both component levels.
 */
const WrapperRow = defineComponent({
  name: 'WrapperRow',
  components: { LeafRow },
  template: '<LeafRow class="wrapper-row" />',
});

const mountHost = (template: string, itemId = '') =>
  mount(
    defineComponent({
      components: { LeafRow, WrapperRow },
      directives: { 'reorder-item': vReorderItem, 'reorder-ignore': vReorderIgnore },
      props: {
        itemId: { type: String, default: '' },
      },
      template,
    }),
    {
      props: { itemId },
    },
  );
/* eslint-enable vue/one-component-per-file -- end of multi-component test fixtures */

describe('vReorderItem', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('writes the item id to a plain element host', () => {
    const wrapper = mountHost('<div v-reorder-item="itemId" class="row" />', 'row-1');

    expect(wrapper.get('.row').attributes(REORDER_ITEM_ATTRIBUTE)).toBe('row-1');
  });

  it('writes the item id to the rendered root element of a component host', () => {
    const wrapper = mountHost('<LeafRow v-reorder-item="itemId" />', 'row-2');

    expect(wrapper.get('.leaf-row').attributes(REORDER_ITEM_ATTRIBUTE)).toBe('row-2');
  });

  it('reaches the real root element through nested single-root components', () => {
    const wrapper = mountHost('<WrapperRow v-reorder-item="itemId" />', 'row-3');

    const rootEl = wrapper.get('.leaf-row');
    expect(rootEl.attributes(REORDER_ITEM_ATTRIBUTE)).toBe('row-3');
    // The attribute must be on the actual rendered root, not on some inner descendant.
    expect(rootEl.element).toBe(wrapper.element);
    expect(wrapper.element.querySelectorAll(`[${REORDER_ITEM_ATTRIBUTE}]`)).toHaveLength(0);
  });

  it('updates and removes the attribute when the binding value changes', async () => {
    const wrapper = mountHost('<WrapperRow v-reorder-item="itemId" />', 'row-4');

    await wrapper.setProps({ itemId: 'row-5' });
    expect(wrapper.get('.leaf-row').attributes(REORDER_ITEM_ATTRIBUTE)).toBe('row-5');

    // The directive treats an empty id as "not a reorder item" and removes the marker.
    await wrapper.setProps({ itemId: '' });
    expect(wrapper.get('.leaf-row').attributes(REORDER_ITEM_ATTRIBUTE)).toBeUndefined();
  });
});

describe('vReorderIgnore', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('marks a plain element host as an ignore zone', () => {
    const wrapper = mountHost('<button v-reorder-ignore type="button">delete</button>');

    expect(wrapper.get('button').attributes(REORDER_IGNORE_ATTRIBUTE)).toBe('');
  });

  it('marks the rendered root element of a component host as an ignore zone', () => {
    const wrapper = mountHost('<LeafRow v-reorder-ignore />');

    expect(wrapper.get('.leaf-row').attributes(REORDER_IGNORE_ATTRIBUTE)).toBe('');
  });
});
