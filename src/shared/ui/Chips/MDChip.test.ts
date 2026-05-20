import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import MDChip from './MDChip.vue';

const mountChip = (props: Record<string, unknown> = {}) =>
  mount(MDChip, {
    attachTo: document.body,
    props: {
      label: 'Filter value',
      type: 'input',
      ...props,
    },
    global: {
      stubs: {
        MDSymbol: {
          template: '<span class="md-symbol-stub" />',
        },
        MDPlainTooltip: {
          template: '<span class="md-plain-tooltip-stub" />',
        },
        MDRichTooltip: {
          template: '<span class="md-rich-tooltip-stub"><slot name="text" /></span>',
        },
      },
    },
  });

describe('MDChip', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders input chips as two sibling buttons without nested buttons or divs', () => {
    const wrapper = mountChip();

    const buttons = wrapper.findAll('button');

    expect(buttons).toHaveLength(2);
    expect(wrapper.find('.md-chip_input-shell > .md-chip__action').exists()).toBe(true);
    expect(wrapper.find('.md-chip_input-shell > .md-chip__close-btn').exists()).toBe(true);
    expect(wrapper.find('.md-chip__action button').exists()).toBe(false);
    expect(wrapper.find('.md-chip__action div').exists()).toBe(false);
  });

  it('emits close clicks without triggering the chip click event', async () => {
    const wrapper = mountChip();

    await wrapper.get('.md-chip__action').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);

    await wrapper.get('.md-chip__close-btn').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.emitted('clickClose')).toHaveLength(1);
  });

  it('focuses the host button when autofocus is enabled', async () => {
    const focusSpy = vi.spyOn(HTMLButtonElement.prototype, 'focus');
    const wrapper = mountChip({ autofocus: true, type: 'assist' });
    await nextTick();

    expect(focusSpy).toHaveBeenCalled();
    expect(wrapper.get('button').element).toBeInstanceOf(HTMLButtonElement);
  });
});
