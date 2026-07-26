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

const getElementProperty = (element: Element, property: string): unknown =>
  Reflect.get(element, property);

describe('MDButton adapter', () => {
  it('maps the stable defaults and explicit shape vocabulary to m3e-button', () => {
    const defaultButton = mountButton().get('m3e-button');

    expect(getElementProperty(defaultButton.element, 'variant')).toBe('filled');
    expect(getElementProperty(defaultButton.element, 'size')).toBe('small');
    expect(getElementProperty(defaultButton.element, 'shape')).toBe('rounded');
    expect(getElementProperty(defaultButton.element, 'type')).toBe('button');
    expect(getElementProperty(defaultButton.element, 'toggle')).toBe(false);
    expect(getElementProperty(defaultButton.element, 'selected')).toBe(false);

    const squareButton = mountButton({ shape: 'square', color: 'outlined' }).get('m3e-button');
    expect(getElementProperty(squareButton.element, 'shape')).toBe('square');
    expect(getElementProperty(squareButton.element, 'variant')).toBe('outlined');
  });

  it('renders the accessible label and optional leading icon through public slots', () => {
    const wrapper = mount(MDButton, {
      props: { label: 'Create' },
      slots: { icon: '<span data-icon>+</span>' },
    });
    const button = wrapper.get('m3e-button');

    expect(button.text()).toContain('Create');
    expect(button.get('.md-button__icon').attributes('slot')).toBe('icon');
  });

  it('keeps loading actionable, exposes busy state, and renders progress', async () => {
    const wrapper = mountButton({ loading: 0 });
    const button = wrapper.get('m3e-button');

    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.attributes('disabled')).toBeUndefined();
    expect(wrapper.get('.md-circular-progress-indicator-stub').attributes('data-progress')).toBe(
      '0',
    );
    expect(wrapper.get('.md-button__label-text').classes()).toContain('md-button__content_loading');
    expect(wrapper.get('.md-button__progress-indicator').classes()).toContain(
      'md-button__progress-indicator_centered',
    );

    await button.trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('preserves icon and label layout while loading replaces their visible presentation', () => {
    const wrapper = mount(MDButton, {
      props: { label: 'Create', loading: true },
      slots: { icon: '<span data-icon>+</span>' },
      global: {
        stubs: {
          MDCircularProgressIndicator: {
            template: '<span class="md-circular-progress-indicator-stub" />',
          },
        },
      },
    });

    expect(wrapper.get('.md-button__icon').classes()).toContain('md-button__content_loading');
    expect(wrapper.get('.md-button__label-text').text()).toBe('Create');
    expect(wrapper.get('.md-button__progress-indicator')).toBeDefined();
  });

  it('maps explicit disabled and native type', () => {
    const button = mountButton({ disabled: true, nativeType: 'submit' }).get('m3e-button');

    expect(getElementProperty(button.element, 'disabled')).toBe(true);
    expect(getElementProperty(button.element, 'type')).toBe('submit');
  });

  it('cancels renderer toggle mutation and emits controlled selection intent', () => {
    const wrapper = mountButton({ variant: 'toggle', selected: false });
    const button = wrapper.get('m3e-button');
    const beforeInput = new InputEvent('beforeinput', { bubbles: true, cancelable: true });

    expect(getElementProperty(button.element, 'toggle')).toBe(true);
    expect(getElementProperty(button.element, 'selected')).toBe(false);

    button.element.dispatchEvent(beforeInput);

    expect(beforeInput.defaultPrevented).toBe(true);
    expect(wrapper.emitted('update:selected')).toEqual([[true]]);
    expect(getElementProperty(button.element, 'selected')).toBe(false);
  });

  it('normalizes unsupported text toggle and ignores selected for default actions', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const textToggle = mountButton({ color: 'text', variant: 'toggle', selected: true }).get(
      'm3e-button',
    );
    const defaultSelected = mountButton({ selected: true }).get('m3e-button');

    expect(getElementProperty(textToggle.element, 'toggle')).toBe(false);
    expect(getElementProperty(textToggle.element, 'selected')).toBe(false);
    expect(getElementProperty(defaultSelected.element, 'toggle')).toBe(false);
    expect(getElementProperty(defaultSelected.element, 'selected')).toBe(false);

    warnSpy.mockRestore();
  });
});
