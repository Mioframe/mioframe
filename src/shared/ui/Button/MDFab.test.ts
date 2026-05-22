import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDFab from './MDFab.vue';

const mountFab = () =>
  mount(MDFab, {
    props: {
      tooltip: 'Create item',
      mdSymbol: 'add',
    },
    global: {
      stubs: {
        MDCircularProgressIndicator: {
          template: '<span class="md-circular-progress-indicator-stub" />',
        },
        MDPlainTooltip: {
          template: '<span class="md-plain-tooltip-stub" />',
        },
        MDSymbol: {
          template: '<span class="md-symbol-stub" />',
        },
      },
    },
  });

describe('MDFab', () => {
  it('keeps native button content free of nested interactive descendants and divs', () => {
    const wrapper = mountFab();
    const button = wrapper.get('button');

    expect(button.find('button').exists()).toBe(false);
    expect(button.find('div').exists()).toBe(false);
    expect(button.find('input, select, textarea, a[href], [role="button"]').exists()).toBe(false);
  });
});
