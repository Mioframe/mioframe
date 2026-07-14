import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MDIconButton from './MDIconButton.vue';

const mountIconButton = (props: Record<string, unknown> = {}) =>
  mount(MDIconButton, {
    props: {
      tooltip: 'Close',
      mdSymbolName: 'close',
      ...props,
    },
    global: {
      stubs: {
        MDCircularProgressIndicator: {
          props: ['progress'],
          template:
            '<span class="md-circular-progress-indicator-stub" :data-progress="progress" />',
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

  it('treats loading=0 as an active loading state', () => {
    const wrapper = mountIconButton({
      loading: 0,
    });

    expect(wrapper.classes()).toContain('md-icon-button_loading');
    expect(wrapper.find('.md-circular-progress-indicator-stub').exists()).toBe(true);
    expect(wrapper.get('.md-circular-progress-indicator-stub').attributes('data-progress')).toBe(
      '0',
    );
    expect(wrapper.get('.md-icon-button__icon').classes()).toContain('md-icon-button__icon');
  });

  it('does not render the progress indicator when loading is false or absent', () => {
    const falseLoadingWrapper = mountIconButton({
      loading: false,
    });
    const absentLoadingWrapper = mountIconButton();

    expect(falseLoadingWrapper.classes()).not.toContain('md-icon-button_loading');
    expect(falseLoadingWrapper.find('.md-circular-progress-indicator-stub').exists()).toBe(false);
    expect(absentLoadingWrapper.classes()).not.toContain('md-icon-button_loading');
    expect(absentLoadingWrapper.find('.md-circular-progress-indicator-stub').exists()).toBe(false);
  });

  it('treats loading=true as an active, indeterminate loading state', () => {
    const wrapper = mountIconButton({ loading: true });

    expect(wrapper.classes()).toContain('md-icon-button_loading');
    expect(wrapper.get('.md-circular-progress-indicator-stub').attributes('data-progress')).toBe(
      '0',
    );
  });

  it('treats a positive numeric loading value as an active, determinate loading state', () => {
    const wrapper = mountIconButton({ loading: 0.5 });

    expect(wrapper.classes()).toContain('md-icon-button_loading');
    expect(wrapper.get('.md-circular-progress-indicator-stub').attributes('data-progress')).toBe(
      '0.5',
    );
  });

  it('defaults nativeType to "button" and reflects an explicit nativeType', () => {
    const defaultWrapper = mountIconButton();
    expect(defaultWrapper.get('button').attributes('type')).toBe('button');

    const submitWrapper = mountIconButton({ nativeType: 'submit' });
    expect(submitWrapper.get('button').attributes('type')).toBe('submit');
  });

  it('does not emit click when disabled', async () => {
    const wrapper = mountIconButton({ disabled: true });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('exposes aria-pressed only for variant="toggle" and reflects selected', () => {
    const defaultWrapper = mountIconButton();
    expect(defaultWrapper.get('button').attributes('aria-pressed')).toBeUndefined();

    const toggleWrapper = mountIconButton({ variant: 'toggle', selected: false });
    expect(toggleWrapper.get('button').attributes('aria-pressed')).toBe('false');

    const toggleSelectedWrapper = mountIconButton({ variant: 'toggle', selected: true });
    expect(toggleSelectedWrapper.get('button').attributes('aria-pressed')).toBe('true');
    expect(toggleSelectedWrapper.classes()).toContain('md-icon-button_selected');
  });

  it('activates via click while loading, exactly once, keeping the accessible name and enabled state', async () => {
    const wrapper = mountIconButton({ loading: true });
    const button = wrapper.get('button');

    expect(button.attributes('aria-label')).toBe('Close');
    expect(button.attributes('disabled')).toBeUndefined();

    await button.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(button.attributes('aria-label')).toBe('Close');
    expect(button.attributes('disabled')).toBeUndefined();
  });

  it('ignores selected and warns when variant is "default"', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const wrapper = mountIconButton({ variant: 'default', selected: true });

    expect(wrapper.classes()).not.toContain('md-icon-button_selected');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('`selected` has no effect unless `variant` is "toggle"'),
    );

    warnSpy.mockRestore();
  });
});
