import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDIconButton from './MDIconButton.vue';

const mountIconButton = () =>
  mount(MDIconButton, {
    props: {
      tooltip: 'Close',
      mdSymbolName: 'close',
    },
    global: {
      stubs: {
        MDCircularProgressIndicator: {
          template: '<span class="md-circular-progress-indicator-stub" />',
        },
        MDPlainTooltip: {
          template: '<span class="md-plain-tooltip-stub" />',
        },
        MDRichTooltip: {
          template: '<span class="md-rich-tooltip-stub"><slot name="text" /></span>',
        },
        MDSymbol: {
          template: '<span class="md-symbol-stub" />',
        },
      },
    },
  });

describe('MDIconButton', () => {
  it('keeps native button content free of nested interactive descendants and divs', () => {
    const wrapper = mountIconButton();
    const button = wrapper.get('button');

    expect(button.find('button').exists()).toBe(false);
    expect(button.find('div').exists()).toBe(false);
    expect(button.find('input, select, textarea, a[href], [role="button"]').exists()).toBe(false);
  });

  it('keeps the icon host as the only non-tooltip element inside the native button', () => {
    const wrapper = mountIconButton();
    const button = wrapper.get('button');
    const directChildren = Array.from(button.element.children).map((child) => child.tagName);

    expect(directChildren.every((tagName) => tagName === 'SPAN')).toBe(true);
    expect(button.findAll('.md-icon-button__icon')).toHaveLength(1);
  });

  it('renders a non-layout target layer as an inline-compatible direct child of the native button', () => {
    const wrapper = mountIconButton();
    const button = wrapper.get('button');
    const directChildren = Array.from(button.element.children);
    const target = button.get('.md-icon-button__target');

    expect(target.attributes('aria-hidden')).toBe('true');
    expect(directChildren[0]).toBe(target.element);
    expect(directChildren.every((child) => child.tagName === 'SPAN')).toBe(true);
  });
});
