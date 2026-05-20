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
});
