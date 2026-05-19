import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDListItem from './MDListItem.vue';

describe('MDListItem', () => {
  it('defaults to a valid one-line list item', () => {
    const wrapper = mount(MDListItem, {
      props: {
        headline: 'Create space',
        supportingText: 'Create or select a folder. Its name becomes the space name.',
      },
    });

    expect(wrapper.attributes('role')).toBe('listitem');
    expect(wrapper.attributes('style')).toContain('--md-list-item-min-height: 56px');
    expect(wrapper.get('.md-list-item__supporting-text').classes()).toContain(
      'md-list-item__supporting-text--one-line',
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

    expect(wrapper.attributes('style')).toContain('--md-list-item-min-height: 72px');
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

    expect(wrapper.attributes('style')).toContain('--md-list-item-min-height: 88px');
    expect(wrapper.get('.md-list-item__supporting-text').classes()).toContain(
      'md-list-item__supporting-text--three-lines',
    );
  });

  it('defaults button items to type button', () => {
    const wrapper = mount(MDListItem, {
      props: {
        is: 'button',
        headline: 'Create space',
      },
    });

    expect(wrapper.get('button').attributes('type')).toBe('button');
  });

  it('does not force a listitem role onto native interactive elements', () => {
    const wrapper = mount(MDListItem, {
      props: {
        is: 'button',
        headline: 'Open space',
      },
    });

    expect(wrapper.get('button').attributes('role')).toBeUndefined();
  });

  it('keeps native list semantics for non-interactive li items', () => {
    const wrapper = mount(MDListItem, {
      props: {
        is: 'li',
        headline: 'Saved item',
      },
    });

    expect(wrapper.element.tagName).toBe('LI');
    expect(wrapper.attributes('role')).toBeUndefined();
  });

  it('renders trailing actions without turning the row into a primary action', () => {
    const wrapper = mount(MDListItem, {
      props: {
        headline: 'Mounted space',
      },
      slots: {
        trailingIcon: '<button type="button">Disconnect</button>',
      },
    });

    expect(wrapper.find('button').text()).toBe('Disconnect');
    expect(wrapper.emitted('click')).toBeUndefined();
  });
});
