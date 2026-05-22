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

  it('does not emit chip clicks when disabled', async () => {
    const wrapper = mountChip({ disabled: true, type: 'assist' });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('click')).toBeUndefined();
    expect(document.body.querySelector('.md-ripple')).toBeNull();
  });

  it('does not emit input chip close clicks when disabled', async () => {
    const wrapper = mountChip({ disabled: true });

    const buttons = wrapper.findAll('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]?.attributes('disabled')).toBeDefined();
    expect(buttons[1]?.attributes('disabled')).toBeDefined();

    const closeButton = buttons[1];
    expect(closeButton).toBeDefined();
    await closeButton?.trigger('click');

    expect(wrapper.emitted('clickClose')).toBeUndefined();
    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('uses a configurable accessible label for the input chip close button', () => {
    const wrapper = mountChip({ closeTooltip: 'Remove filter chip' });
    const buttons = wrapper.findAll('button');
    const closeButton = buttons[1];

    expect(closeButton?.attributes('aria-label')).toBe('Remove filter chip');
  });

  it('keeps the default close button label for backward compatibility', () => {
    const wrapper = mountChip();
    const buttons = wrapper.findAll('button');
    const closeButton = buttons[1];

    expect(closeButton?.attributes('aria-label')).toBe('remove');
  });

  it('focuses the host button when autofocus is enabled', async () => {
    const focusSpy = vi.spyOn(HTMLButtonElement.prototype, 'focus');
    const wrapper = mountChip({ autofocus: true, type: 'assist' });
    await nextTick();

    expect(focusSpy).toHaveBeenCalled();
    expect(wrapper.get('button').element).toBeInstanceOf(HTMLButtonElement);
  });
});
