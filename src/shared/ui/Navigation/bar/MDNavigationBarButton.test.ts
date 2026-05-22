import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDNavigationBarButton from './MDNavigationBarButton.vue';

const mountNavigationBarButton = (props: Record<string, unknown> = {}) =>
  mount(MDNavigationBarButton, {
    props: {
      label: 'Library',
      symbol: 'menu_book',
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

describe('MDNavigationBarButton', () => {
  it('keeps native button content free of nested buttons, divs, and interactive descendants', () => {
    const wrapper = mountNavigationBarButton();
    const button = wrapper.get('button');

    expect(button.find('button').exists()).toBe(false);
    expect(button.find('div').exists()).toBe(false);
    expect(button.find('input, select, textarea, a[href], [role="button"]').exists()).toBe(false);
  });
});
