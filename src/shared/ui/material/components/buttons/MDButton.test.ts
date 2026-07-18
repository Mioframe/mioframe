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

  it('reserves the minimum interaction target on the native button itself and marks the visual container as the focus-indicator bounding source', () => {
    const wrapper = mountButton({ size: 'extra-small' });
    const button = wrapper.get('button');
    const directChildren = Array.from(button.element.children);
    const container = button.get('.md-button__container');

    // The button (semantic host + layout footprint + interaction bounds) is a real flow box, not
    // an absolutely positioned overlay: the visual container is its only, real DOM child.
    expect(directChildren).toHaveLength(1);
    expect(directChildren[0]).toBe(container.element);
    expect(directChildren.every((child) => child.tagName === 'SPAN')).toBe(true);
    // The visual container — not the (possibly larger) button host — is the intended focus target.
    expect(container.attributes('data-md-focus-indicator-target')).toBeDefined();
  });

  it('treats loading=0 as an active loading state rendered with the indeterminate visual', () => {
    const wrapper = mountButton({
      loading: 0,
    });

    expect(wrapper.classes()).toContain('md-button_loading');
    const indicator = wrapper.get('.md-circular-progress-indicator-stub');
    expect(indicator.attributes('data-progress')).toBeUndefined();
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

  it('normalizes color="text" + variant="toggle" to the default variant and warns', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const selectedWrapper = mountButton({ variant: 'toggle', color: 'text', selected: true });

    expect(selectedWrapper.get('button').attributes('aria-pressed')).toBeUndefined();
    expect(selectedWrapper.classes()).not.toContain('md-button_selected');
    expect(selectedWrapper.classes()).toContain('md-button_variant-default');
    expect(selectedWrapper.classes()).not.toContain('md-button_variant-toggle');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('does not support `variant="toggle"`'),
    );

    warnSpy.mockRestore();
  });

  it('keeps ordinary color="text" variant="default" unchanged and warning-free', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const wrapper = mountButton({ color: 'text' });

    expect(wrapper.classes()).toContain('md-button_variant-default');
    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('keeps aria-pressed and selected structure while disabled', () => {
    const wrapper = mountButton({ variant: 'toggle', selected: true, disabled: true });
    const button = wrapper.get('button');

    expect(button.attributes('aria-pressed')).toBe('true');
    expect(wrapper.classes()).toContain('md-button_selected');
    expect(wrapper.classes()).toContain('md-state_disabled');
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

  it('exposes aria-busy only while loading and marks the progress indicator decorative', () => {
    const notLoadingWrapper = mountButton();
    expect(notLoadingWrapper.get('button').attributes('aria-busy')).toBeUndefined();

    const falseLoadingWrapper = mountButton({ loading: false });
    expect(falseLoadingWrapper.get('button').attributes('aria-busy')).toBeUndefined();

    const loadingWrapper = mountButton({ loading: true });
    expect(loadingWrapper.get('button').attributes('aria-busy')).toBe('true');
    expect(
      loadingWrapper.get('.md-circular-progress-indicator-stub').attributes('aria-hidden'),
    ).toBe('true');

    const numericLoadingWrapper = mountButton({ loading: 0.5 });
    expect(numericLoadingWrapper.get('button').attributes('aria-busy')).toBe('true');
  });

  it('does not render the icon wrapper when the icon slot is omitted', () => {
    const wrapper = mountButton();

    expect(wrapper.classes()).not.toContain('md-button_icon');
    expect(wrapper.find('.md-button__icon').exists()).toBe(false);
  });

  it.each([
    { loading: 0, expectedProgress: undefined, shouldWarn: false },
    { loading: 1, expectedProgress: '1', shouldWarn: false },
    { loading: 0.5, expectedProgress: '0.5', shouldWarn: false },
    { loading: -1, expectedProgress: undefined, shouldWarn: true },
    { loading: 1.5, expectedProgress: '1', shouldWarn: true },
    { loading: Number.NaN, expectedProgress: undefined, shouldWarn: true },
    { loading: Number.POSITIVE_INFINITY, expectedProgress: undefined, shouldWarn: true },
    { loading: Number.NEGATIVE_INFINITY, expectedProgress: undefined, shouldWarn: true },
  ])(
    'normalizes numeric loading=$loading to a clamped [0, 1] progress value, rendering a clamped 0 as indeterminate',
    ({ loading, expectedProgress, shouldWarn }) => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      const wrapper = mountButton({ loading });

      expect(wrapper.get('.md-circular-progress-indicator-stub').attributes('data-progress')).toBe(
        expectedProgress,
      );
      if (shouldWarn) {
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('`loading` numeric value'));
      } else {
        expect(warnSpy).not.toHaveBeenCalled();
      }

      warnSpy.mockRestore();
    },
  );
});
