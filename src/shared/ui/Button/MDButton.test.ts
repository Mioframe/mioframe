import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MDButton from './MDButton.vue';

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(MDButton, {
    props: {
      label: 'Save',
      ...props,
    },
    global: {
      stubs: {
        MDCircularProgressIndicator: {
          props: ['progress'],
          template:
            '<span class="md-circular-progress-indicator-stub" :data-progress="progress" />',
        },
      },
    },
  });

describe('MDButton', () => {
  it('keeps native button content free of nested buttons and divs', () => {
    const wrapper = mountButton();
    const button = wrapper.get('button');

    expect(button.find('button').exists()).toBe(false);
    expect(button.find('div').exists()).toBe(false);
    expect(button.findAll('span').length).toBeGreaterThan(0);
  });

  it('renders a non-layout target layer as a direct child of the native button', () => {
    const wrapper = mountButton({ size: 'extra-small' });
    const button = wrapper.get('button');
    const directChildren = Array.from(button.element.children);
    const target = button.get('.md-button__target');

    expect(target.attributes('aria-hidden')).toBe('true');
    expect(directChildren[0]).toBe(target.element);
    expect(directChildren.every((child) => child.tagName === 'SPAN')).toBe(true);
  });

  it('treats loading=0 as an active loading state', () => {
    const wrapper = mountButton({
      loading: 0,
    });

    expect(wrapper.classes()).toContain('md-button_loading');
    expect(wrapper.find('.md-circular-progress-indicator-stub').exists()).toBe(true);
    expect(wrapper.get('.md-circular-progress-indicator-stub').attributes('data-progress')).toBe(
      '0',
    );
  });

  it('does not treat loading=false or absent loading as an active loading state', () => {
    const falseLoadingWrapper = mountButton({
      loading: false,
    });
    const absentLoadingWrapper = mountButton();

    expect(falseLoadingWrapper.classes()).not.toContain('md-button_loading');
    expect(falseLoadingWrapper.find('.md-circular-progress-indicator-stub').exists()).toBe(false);
    expect(absentLoadingWrapper.classes()).not.toContain('md-button_loading');
    expect(absentLoadingWrapper.find('.md-circular-progress-indicator-stub').exists()).toBe(false);
  });

  it('treats loading=true as an active, indeterminate loading state', () => {
    const wrapper = mountButton({ loading: true });

    expect(wrapper.classes()).toContain('md-button_loading');
    const indicator = wrapper.get('.md-circular-progress-indicator-stub');
    expect(indicator.attributes('data-progress')).toBeUndefined();
  });

  it('treats a positive numeric loading value as an active, determinate loading state', () => {
    const wrapper = mountButton({ loading: 0.5 });

    expect(wrapper.classes()).toContain('md-button_loading');
    expect(wrapper.get('.md-circular-progress-indicator-stub').attributes('data-progress')).toBe(
      '0.5',
    );
  });

  it('defaults nativeType to "button" and reflects an explicit nativeType', () => {
    const defaultWrapper = mountButton();
    expect(defaultWrapper.get('button').attributes('type')).toBe('button');

    const submitWrapper = mountButton({ nativeType: 'submit' });
    expect(submitWrapper.get('button').attributes('type')).toBe('submit');
  });

  it('does not emit click when disabled', async () => {
    const wrapper = mountButton({ disabled: true });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('click')).toBeUndefined();
  });

  it('exposes aria-pressed only for variant="toggle" and reflects selected', () => {
    const defaultWrapper = mountButton();
    expect(defaultWrapper.get('button').attributes('aria-pressed')).toBeUndefined();

    const toggleWrapper = mountButton({ variant: 'toggle', selected: false });
    expect(toggleWrapper.get('button').attributes('aria-pressed')).toBe('false');

    const toggleSelectedWrapper = mountButton({ variant: 'toggle', selected: true });
    expect(toggleSelectedWrapper.get('button').attributes('aria-pressed')).toBe('true');
    expect(toggleSelectedWrapper.classes()).toContain('md-button_selected');
  });

  it('ignores selected and warns when variant is "default"', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const wrapper = mountButton({ variant: 'default', selected: true });

    expect(wrapper.classes()).not.toContain('md-button_selected');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('`selected` has no effect unless `variant` is "toggle"'),
    );

    warnSpy.mockRestore();
  });

  it('supports variant="toggle" with color="text" without warning or restriction', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const unselectedWrapper = mountButton({ variant: 'toggle', color: 'text', selected: false });
    expect(unselectedWrapper.get('button').attributes('aria-pressed')).toBe('false');
    expect(unselectedWrapper.classes()).not.toContain('md-button_selected');

    const selectedWrapper = mountButton({ variant: 'toggle', color: 'text', selected: true });
    expect(selectedWrapper.get('button').attributes('aria-pressed')).toBe('true');
    expect(selectedWrapper.classes()).toContain('md-button_selected');

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('emits click on native click and toggling does not introduce hidden local selection state', async () => {
    const wrapper = mountButton({ variant: 'toggle', selected: false });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.get('button').attributes('aria-pressed')).toBe('false');
  });

  it('activates via click while loading, exactly once, keeping the accessible name and enabled state', async () => {
    const wrapper = mountButton({ loading: true });
    const button = wrapper.get('button');

    expect(button.attributes('aria-label')).toBe('Save');
    expect(button.attributes('disabled')).toBeUndefined();

    await button.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(button.attributes('aria-label')).toBe('Save');
    expect(button.attributes('disabled')).toBeUndefined();
  });
});
