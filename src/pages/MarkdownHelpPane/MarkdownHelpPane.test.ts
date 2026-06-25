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
}));

const scrollIntoView = vi.fn();
HTMLElement.prototype.scrollIntoView = scrollIntoView;

describe('MarkdownHelpPane', () => {
  afterEach(() => {
    scrollIntoView.mockClear();
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
    const wrapper = mount(MarkdownHelpPane, {
      props: {
        headline: 'Guide',
        markdown: '# Guide\n\n## Step One\n\nText.',
        paneClass: 'help-article-pane',
        anchor: 'step-one',
      },
    });
    await nextTick();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(wrapper.find('#step-one').element);
  });

  it('falls back to scrolling its own content container to the top when no anchor is provided', () => {
    const wrapper = mount(MarkdownHelpPane, {
      props: {
        headline: 'Guide',
        markdown: '# Guide\n\n## Step One\n\nText.',
        paneClass: 'help-article-pane',
      },
    });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
    expect(scrollIntoView.mock.instances[0]).toBe(
      wrapper.find('.markdown-help-pane__content').element,
    );
  });

  it('falls back to scrolling to top when the anchor heading is missing', () => {
    const wrapper = mount(MarkdownHelpPane, {
      props: {
        headline: 'Guide',
        markdown: '# Guide\n\n## Step One\n\nText.',
        paneClass: 'help-article-pane',
        anchor: 'does-not-exist',
      },
    });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(
      wrapper.find('.markdown-help-pane__content').element,
    );
  });

  it('scrolls to the new anchor when the anchor changes within the same article', async () => {
    const wrapper = mount(MarkdownHelpPane, {
      props: {
        headline: 'Guide',
        markdown: '# Guide\n\n## Step One\n\n## Step Two',
        paneClass: 'help-article-pane',
      },
    });
    scrollIntoView.mockClear();

    await wrapper.setProps({ anchor: 'step-two' });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(wrapper.find('#step-two').element);
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

    await wrapper.setProps({
      headline: 'Other',
      markdown: '# Other\n\n## Step Two',
      anchor: undefined,
    });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(
      wrapper.find('.markdown-help-pane__content').element,
    );
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable the rule after the inline component stub used in this file. */
