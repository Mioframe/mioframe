import { readFileSync } from 'node:fs';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDButton from './MDButton.vue';

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(MDButton, { props: { label: 'Save', ...props } });

const getElementProperty = (element: Element, property: string): unknown =>
  Reflect.get(element, property);

describe('MDButton adapter', () => {
  it('owns only the selected text Button color tokens and maps them privately', () => {
    const css = readFileSync('./src/shared/ui/material/components/button/tokens.css', 'utf8');
    const publicTokens = [
      '--md-comp-button-text-label-text-color',
      '--md-comp-button-text-hovered-label-text-color',
      '--md-comp-button-text-focused-label-text-color',
      '--md-comp-button-text-pressed-label-text-color',
      '--md-comp-button-text-hovered-state-layer-color',
      '--md-comp-button-text-focused-state-layer-color',
      '--md-comp-button-text-pressed-state-layer-color',
    ];

    for (const token of publicTokens) expect(css).toContain(`${token}:`);
    expect(css).toContain('--m3e-text-button-label-text-color:');
    expect(css).toContain('--m3e-text-button-hover-label-text-color:');
    expect(css).toContain('--m3e-text-button-focus-label-text-color:');
    expect(css).toContain('--m3e-text-button-pressed-label-text-color:');
    expect(css).toContain('--m3e-text-button-hover-state-layer-color:');
    expect(css).toContain('--m3e-text-button-focus-state-layer-color:');
    expect(css).toContain('--m3e-text-button-pressed-state-layer-color:');
    expect(css).not.toContain('--md-comp-button-text-icon-color');
    expect(css).not.toContain('--md-comp-button-text-hover-state-layer-color');
    expect(css).not.toContain('--md-comp-button-text-focus-state-layer-color');
    expect(css).not.toContain('--md-content-color');
  });

  it('maps the demand-scoped defaults and retained values', () => {
    const defaultButton = mountButton().get('m3e-button');
    expect(getElementProperty(defaultButton.element, 'variant')).toBe('filled');
    expect(getElementProperty(defaultButton.element, 'size')).toBe('small');
    expect(getElementProperty(defaultButton.element, 'shape')).toBe('rounded');
    expect(getElementProperty(defaultButton.element, 'type')).toBe('button');
    expect(getElementProperty(defaultButton.element, 'toggle')).toBe(false);

    const explicitButton = mountButton({ color: 'outlined', size: 'extra-small' }).get(
      'm3e-button',
    );
    expect(getElementProperty(explicitButton.element, 'variant')).toBe('outlined');
    expect(getElementProperty(explicitButton.element, 'size')).toBe('extra-small');
  });

  it('renders the action label and optional leading icon', () => {
    const wrapper = mount(MDButton, {
      props: { label: 'Create' },
      slots: { icon: '<span data-icon>+</span>' },
    });
    const button = wrapper.get('m3e-button');
    expect(button.text()).toContain('Create');
    expect(button.get('.md-button__icon').attributes('slot')).toBe('icon');
  });

  it('maps explicit disabled and submit type', () => {
    const button = mountButton({ disabled: true, nativeType: 'submit' }).get('m3e-button');
    expect(getElementProperty(button.element, 'disabled')).toBe(true);
    expect(getElementProperty(button.element, 'type')).toBe('submit');
  });

  it('maps false Boolean values as properties and forwards global attributes', () => {
    const button = mount(MDButton, {
      attrs: { id: 'save-action', title: 'Save changes' },
      props: { disabled: false, label: 'Save' },
    }).get('m3e-button');

    expect(getElementProperty(button.element, 'disabled')).toBe(false);
    expect(getElementProperty(button.element, 'toggle')).toBe(false);
    expect(button.attributes('disabled')).toBeUndefined();
    expect(button.attributes('id')).toBe('save-action');
    expect(button.attributes('title')).toBe('Save changes');
  });

  it('forwards the renderer click payload unchanged', async () => {
    const wrapper = mountButton();
    const event = new MouseEvent('click');

    wrapper.get('m3e-button').element.dispatchEvent(event);
    await wrapper.vm.$nextTick();

    expect(wrapper.emitted('click')).toEqual([[event]]);
  });

  it('uses a decorative loading indicator, marks the button busy, and restores its icon', async () => {
    const wrapper = mount(MDButton, {
      props: { label: 'Save', loading: true },
      slots: { icon: '<span data-icon>+</span>' },
    });
    const button = wrapper.get('m3e-button');
    const indicator = button.get('m3e-loading-indicator');
    expect(button.attributes('aria-busy')).toBe('true');
    expect(indicator.attributes('aria-hidden')).toBe('true');
    expect(indicator.classes()).toContain('md-button__loading-indicator');
    expect(indicator.attributes('style')).toContain('width: 24px');
    expect(button.find('[data-icon]').exists()).toBe(false);

    await wrapper.setProps({ loading: false });
    expect(button.attributes('aria-busy')).toBeUndefined();
    expect(button.find('m3e-loading-indicator').exists()).toBe(false);
    expect(button.find('[data-icon]').exists()).toBe(true);
  });

  it('keeps explicit disabled ownership while loading', () => {
    const button = mountButton({ disabled: true, loading: true }).get('m3e-button');
    expect(getElementProperty(button.element, 'disabled')).toBe(true);
    expect(button.attributes('aria-busy')).toBe('true');
  });
});
