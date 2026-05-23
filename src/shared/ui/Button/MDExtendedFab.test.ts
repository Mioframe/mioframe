import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDExtendedFab from './MDExtendedFab.vue';

describe('MDExtendedFab', () => {
  it('keeps native button content free of nested interactive descendants and divs', () => {
    const wrapper = mount(MDExtendedFab, {
      props: {
        tooltip: 'Add document',
        label: 'Add',
        mdSymbol: 'add',
      },
      global: {
        stubs: {
          MDCircularProgressIndicator: { template: '<span />' },
          MDPlainTooltip: { template: '<span />' },
          MDSymbol: { template: '<span />' },
        },
      },
    });

    const button = wrapper.get('button');

    expect(button.find('button').exists()).toBe(false);
    expect(button.find('div').exists()).toBe(false);
    expect(button.find('input, select, textarea, a[href], [role="button"]').exists()).toBe(false);
  });
});
