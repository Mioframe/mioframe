import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MDButton from './MDButton.vue';

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(MDButton, {
    props: {
      label: 'Save',
      ...props,
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

  it('maps explicit disabled and native type', () => {
    const button = mountButton({ disabled: true, nativeType: 'submit' }).get('m3e-button');

    expect(getElementProperty(button.element, 'disabled')).toBe(true);
    expect(getElementProperty(button.element, 'type')).toBe('submit');
  });

  it('routes selected label and selected icons through documented renderer slots', () => {
    const wrapper = mount(MDButton, {
      props: { label: 'Start', selected: true, variant: 'toggle' },
      slots: {
        'selected-label': 'Stop',
        'selected-icon': '<span data-selected-icon />',
      },
    });

    expect(wrapper.get('[slot="selected"]').text()).toBe('Stop');
    expect(wrapper.get('[slot="selected-icon"]').get('[data-selected-icon]')).toBeDefined();
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

  it('supports toggle with the text color configuration', () => {
    const textToggle = mountButton({ color: 'text', variant: 'toggle', selected: true }).get(
      'm3e-button',
    );

    expect(getElementProperty(textToggle.element, 'toggle')).toBe(true);
    expect(getElementProperty(textToggle.element, 'selected')).toBe(true);
  });

  it('ignores selected for default actions and warns in development', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const defaultSelected = mountButton({ selected: true }).get('m3e-button');

    expect(getElementProperty(defaultSelected.element, 'toggle')).toBe(false);
    expect(getElementProperty(defaultSelected.element, 'selected')).toBe(false);

    warnSpy.mockRestore();
  });

  it('composes the canonical MDLoadingIndicator in place of the leading icon, handing off label and size, and marks the interactive owner busy', () => {
    const wrapper = mount(MDButton, {
      props: { label: 'Save', loading: true, size: 'medium' },
      slots: { icon: '<span data-icon>+</span>' },
    });
    const button = wrapper.get('m3e-button');
    const indicator = button.get('m3e-loading-indicator');

    expect(button.attributes('aria-busy')).toBe('true');
    expect(indicator.attributes('aria-label')).toBe('Save');
    expect(indicator.attributes('style')).toContain('--m3e-loading-indicator-size: 24px');
    expect(button.find('[data-icon]').exists()).toBe(false);
  });

  it.each([
    ['extra-small', 24],
    ['small', 24],
    ['medium', 24],
    ['large', 32],
    ['extra-large', 40],
  ] as const)(
    'maps Button size %s to the Loading indicator composition size %ipx',
    (size, expectedSize) => {
      const button = mount(MDButton, { props: { label: 'Save', loading: true, size } }).get(
        'm3e-button',
      );
      const indicator = button.get('m3e-loading-indicator');

      expect(indicator.attributes('style')).toContain(
        `--m3e-loading-indicator-size: ${expectedSize}px`,
      );
    },
  );

  it('restores the leading icon and clears aria-busy once loading ends', () => {
    const wrapper = mount(MDButton, {
      props: { label: 'Save', loading: false },
      slots: { icon: '<span data-icon>+</span>' },
    });
    const button = wrapper.get('m3e-button');

    expect(button.attributes('aria-busy')).toBeUndefined();
    expect(button.find('m3e-loading-indicator').exists()).toBe(false);
    expect(button.find('[data-icon]').exists()).toBe(true);
  });

  it('replaces the selected icon route with the Loading indicator when toggle, selected, selected-icon, and loading are combined', () => {
    const wrapper = mount(MDButton, {
      props: { label: 'Start', variant: 'toggle', selected: true, loading: true },
      slots: {
        'selected-icon': '<span data-selected-icon />',
        icon: '<span data-icon />',
      },
    });
    const button = wrapper.get('m3e-button');

    expect(button.find('m3e-loading-indicator').exists()).toBe(true);
    expect(button.find('[data-selected-icon]').exists()).toBe(false);
    expect(button.find('[slot="selected-icon"]').exists()).toBe(false);
    expect(button.find('[data-icon]').exists()).toBe(false);
  });

  it('restores the selected icon after loading ends while still selected', async () => {
    const wrapper = mount(MDButton, {
      props: { label: 'Start', variant: 'toggle', selected: true, loading: true },
      slots: { 'selected-icon': '<span data-selected-icon />' },
    });

    expect(wrapper.get('m3e-button').find('[data-selected-icon]').exists()).toBe(false);

    await wrapper.setProps({ loading: false });
    const button = wrapper.get('m3e-button');

    expect(button.find('m3e-loading-indicator').exists()).toBe(false);
    expect(button.find('[data-selected-icon]').exists()).toBe(true);
  });

  it('restores the normal icon after loading ends when no longer selected', async () => {
    const wrapper = mount(MDButton, {
      props: { label: 'Start', variant: 'toggle', selected: false, loading: true },
      slots: { icon: '<span data-icon />' },
    });

    expect(wrapper.get('m3e-button').find('[data-icon]').exists()).toBe(false);

    await wrapper.setProps({ loading: false });
    const button = wrapper.get('m3e-button');

    expect(button.find('m3e-loading-indicator').exists()).toBe(false);
    expect(button.find('[data-icon]').exists()).toBe(true);
  });

  it('keeps loading, aria-busy, and the disabled renderer contract together when disabled and loading are combined', () => {
    const button = mountButton({ disabled: true, loading: true }).get('m3e-button');

    expect(getElementProperty(button.element, 'disabled')).toBe(true);
    expect(button.attributes('aria-busy')).toBe('true');
    expect(button.find('m3e-loading-indicator').exists()).toBe(true);
  });
});
