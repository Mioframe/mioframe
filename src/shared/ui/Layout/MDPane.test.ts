/* eslint-disable vue/one-component-per-file -- This test file intentionally defines small inline stub components. */
import { mount } from '@vue/test-utils';
import { defineComponent, h, nextTick } from 'vue';
import { describe, expect, it } from 'vitest';
import MDPane from './MDPane.vue';
import { usePaneScrollContainer } from './paneScrollContainer';
import { useAllowedBottomNavigation } from './allowedBottomNavigation';

const ScrollContainerProbe = defineComponent({
  name: 'ScrollContainerProbe',
  setup() {
    const scrollContainer = usePaneScrollContainer();
    return () => h('div', { 'data-probe': scrollContainer.value?.className });
  },
});

type PaneTestSlots = {
  default: () => unknown;
  topBar?: () => unknown;
};

const mountPane = (paneSlots: PaneTestSlots) => {
  const SplitLayoutHost = defineComponent({
    name: 'SplitLayoutHost',
    setup() {
      useAllowedBottomNavigation();
      return () => h(MDPane, null, paneSlots);
    },
  });

  return mount(SplitLayoutHost);
};

describe('MDPane', () => {
  it('renders the topBar slot inside .md-pane__top-bar, outside .md-pane__content', () => {
    const wrapper = mountPane({
      topBar: () => h('div', { class: 'stub-top-bar' }, 'top bar'),
      default: () => h('div', { class: 'stub-body' }, 'body'),
    });

    const topBar = wrapper.find('.md-pane__top-bar');
    expect(topBar.exists()).toBe(true);
    expect(topBar.find('.stub-top-bar').exists()).toBe(true);
    expect(wrapper.find('.md-pane__content .stub-top-bar').exists()).toBe(false);
  });

  it('does not render .md-pane__top-bar when the topBar slot is absent', () => {
    const wrapper = mountPane({
      default: () => h('div', { class: 'stub-body' }, 'body'),
    });

    expect(wrapper.find('.md-pane__top-bar').exists()).toBe(false);
  });

  it('renders the default slot inside .md-pane__content', () => {
    const wrapper = mountPane({
      default: () => h('div', { class: 'stub-body' }, 'body'),
    });

    expect(wrapper.find('.md-pane__content .stub-body').exists()).toBe(true);
  });

  it('provides the .md-pane__content element as the pane scroll container', async () => {
    const wrapper = mountPane({
      default: () => h(ScrollContainerProbe),
    });
    await nextTick();

    const probe = wrapper.find('[data-probe]');
    expect(probe.attributes('data-probe')).toContain('md-pane__content');
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stubs used in this file. */
