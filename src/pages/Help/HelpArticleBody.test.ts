import { mount } from '@vue/test-utils';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { computed, nextTick } from 'vue';
import HelpArticleBody from './HelpArticleBody.vue';

const paneContainerEl = document.createElement('div');
const scrollTo = vi.fn();
paneContainerEl.scrollTo = scrollTo;

vi.mock('@shared/ui/Layout', () => ({
  usePaneScrollContainer: () => computed(() => paneContainerEl),
}));

const scrollIntoView = vi.fn();
let originalScrollIntoView: typeof HTMLElement.prototype.scrollIntoView;

describe('HelpArticleBody', () => {
  beforeAll(() => {
    // oxlint-disable-next-line unbound-method -- stored only for restoration, never called unbound.
    originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollIntoView;
  });

  afterAll(() => {
    HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  });

  afterEach(() => {
    scrollIntoView.mockClear();
    scrollTo.mockClear();
  });

  it('renders deterministic heading ids for in-page anchor scrolling', () => {
    const wrapper = mount(HelpArticleBody, {
      props: {
        markdown: '# Guide\n\n## Step One\n\nText.',
      },
    });

    expect(wrapper.find('#step-one').exists()).toBe(true);
  });

  it('scrolls to the matching heading when an anchor is provided', async () => {
    const wrapper = mount(HelpArticleBody, {
      props: {
        markdown: '# Guide\n\n## Step One\n\nText.',
        anchor: 'step-one',
      },
    });
    await nextTick();

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(wrapper.find('#step-one').element);
  });

  it('falls back to scrolling the pane container to the top when no anchor is provided', () => {
    mount(HelpArticleBody, {
      props: {
        markdown: '# Guide\n\n## Step One\n\nText.',
      },
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it('falls back to scrolling the pane container to the top when the anchor heading is missing', () => {
    mount(HelpArticleBody, {
      props: {
        markdown: '# Guide\n\n## Step One\n\nText.',
        anchor: 'does-not-exist',
      },
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });

  it('scrolls to the new anchor when the anchor changes within the same article', async () => {
    const wrapper = mount(HelpArticleBody, {
      props: {
        markdown: '# Guide\n\n## Step One\n\n## Step Two',
      },
    });
    scrollIntoView.mockClear();

    await wrapper.setProps({ anchor: 'step-two' });

    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.instances[0]).toBe(wrapper.find('#step-two').element);
  });

  it('scrolls the pane container to top when navigating to a different article without an anchor', async () => {
    const wrapper = mount(HelpArticleBody, {
      props: {
        markdown: '# Guide\n\n## Step One',
        anchor: 'step-one',
      },
    });
    scrollIntoView.mockClear();
    scrollTo.mockClear();

    await wrapper.setProps({
      markdown: '# Other\n\n## Step Two',
      anchor: undefined,
    });

    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledTimes(1);
    expect(scrollTo).toHaveBeenCalledWith({ top: 0 });
  });
});
