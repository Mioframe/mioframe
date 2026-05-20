import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDNavigationRailButton from './MDNavigationRailButton.vue';
import { BUTTON_TYPE } from './types';

const mountNavigationRailButton = (props: Record<string, unknown> = {}) =>
  mount(MDNavigationRailButton, {
    props: {
      label: 'Library',
      symbol: 'menu_book',
      type: BUTTON_TYPE.vertical,
      ...props,
    },
    global: {
      stubs: {
        MDSymbol: {
          template: '<span class="md-symbol-stub" />',
        },
      },
    },
  });

describe('MDNavigationRailButton', () => {
  it('keeps native button content free of nested buttons, divs, and interactive descendants', () => {
    const wrapper = mountNavigationRailButton();
    const button = wrapper.get('button');

    expect(button.find('button').exists()).toBe(false);
    expect(button.find('div').exists()).toBe(false);
    expect(button.find('input, select, textarea, a[href], [role="button"]').exists()).toBe(false);
  });
});
