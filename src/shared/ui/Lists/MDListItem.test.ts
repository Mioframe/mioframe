import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDListItem from './MDListItem.vue';

describe('MDListItem', () => {
  it('keeps supporting text single-line by default', () => {
    const wrapper = mount(MDListItem, {
      props: {
        headline: 'Create space',
        supportingText: 'Create or select a folder. Its name becomes the space name.',
      },
    });

    expect(wrapper.get('.md-list-item__supporting-text').classes()).not.toContain(
      'md-list-item__supporting-text--two-lines',
    );
    expect(wrapper.get('.md-list-item__supporting-text').classes()).not.toContain(
      'md-list-item__supporting-text--three-lines',
    );
  });

  it('uses the explicit two-line variant when requested', () => {
    const wrapper = mount(MDListItem, {
      props: {
        headline: 'Create space',
        supportingText: 'Create or select a folder. Its name becomes the space name.',
        lines: 2,
      },
    });

    expect(wrapper.get('.md-list-item__supporting-text').classes()).toContain(
      'md-list-item__supporting-text--two-lines',
    );
  });

  it('uses the explicit three-line variant when requested', () => {
    const wrapper = mount(MDListItem, {
      props: {
        headline: 'Create space',
        supportingText: 'Create or select a folder. Its name becomes the space name.',
        lines: 3,
      },
    });

    expect(wrapper.get('.md-list-item__supporting-text').classes()).toContain(
      'md-list-item__supporting-text--three-lines',
    );
  });
});
