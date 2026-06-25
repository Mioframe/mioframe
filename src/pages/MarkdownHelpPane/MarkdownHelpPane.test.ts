/* eslint-disable vue/one-component-per-file -- This test file intentionally defines a tiny inline stub component. */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, nextTick } from 'vue';
import MarkdownHelpPane from './MarkdownHelpPane.vue';

vi.mock('@shared/ui/AppBar', () => ({
  MDAppBar: defineComponent({
    name: 'MDAppBarStub',
    props: { headline: { type: String, required: true } },
    setup(props, { slots }) {
      return () => h('header', [h('h1', props.headline), slots.leadingButton?.()]);
    },
  }),
}));

vi.mock('@shared/ui/Layout', () => ({
  MDPane: defineComponent({
    name: 'MDPaneStub',
    setup(_props, { slots }) {
      return () => h('section', slots.default?.());
    },
  }),
  usePaneContainer: () => ({ value: document.body }),
}));

const scrollIntoView = vi.fn();
const scrollTo = vi.fn();
HTMLElement.prototype.scrollIntoView = scrollIntoView;
HTMLElement.prototype.scrollTo = scrollTo;

describe('MarkdownHelpPane', () => {
  afterEach(() => {
    scrollIntoView.mockClear();
    scrollTo.mockClear();
  });

  it('renders deterministic heading ids for in-page anchor scrolling', () => {
    const wrapper = mount(MarkdownHelpPane, {
      props: {
        headline: 'Guide',
        markdown: '# Guide\n\n## Step One\n\nText.',
        paneClass: 'help-article-pane',
      },
    });

    expect(wrapper.find('#step-one').exists()).toBe(true);
  });

  it('scrolls to the matching heading when an anchor is provided', async () => {
    mount(MarkdownHelpPane, {
      props: {
        headline: 'Guide',
        markdown: '# Guide\n\n## Step One\n\nText.',
        paneClass: 'help-article-pane',
        anchor: 'step-one',
      },
    });
    await nextTick();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('falls back to scrolling to top when no anchor is provided', () => {
    mount(MarkdownHelpPane, {
      props: {
        headline: 'Guide',
        markdown: '# Guide\n\n## Step One\n\nText.',
        paneClass: 'help-article-pane',
      },
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it('falls back to scrolling to top when the anchor heading is missing', () => {
    mount(MarkdownHelpPane, {
      props: {
        headline: 'Guide',
        markdown: '# Guide\n\n## Step One\n\nText.',
        paneClass: 'help-article-pane',
        anchor: 'does-not-exist',
      },
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it('scrolls to the new anchor when the anchor changes within the same article', async () => {
    const wrapper = mount(MarkdownHelpPane, {
      props: {
        headline: 'Guide',
        markdown: '# Guide\n\n## Step One\n\n## Step Two',
        paneClass: 'help-article-pane',
      },
    });
    scrollTo.mockClear();

    await wrapper.setProps({ anchor: 'step-two' });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
  });

  it('scrolls to top when navigating to a different article without an anchor', async () => {
    const wrapper = mount(MarkdownHelpPane, {
      props: {
        headline: 'Guide',
        markdown: '# Guide\n\n## Step One',
        paneClass: 'help-article-pane',
        anchor: 'step-one',
      },
    });
    scrollIntoView.mockClear();
    scrollTo.mockClear();

    await wrapper.setProps({
      headline: 'Other',
      markdown: '# Other\n\n## Step Two',
      anchor: undefined,
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stub used in this file. */
