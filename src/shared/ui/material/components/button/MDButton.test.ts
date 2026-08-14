import { readFileSync } from 'node:fs';
import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import MDButton from './MDButton.vue';

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(MDButton, { props: { label: 'Save', ...props } });

const getElementProperty = (element: Element, property: string): unknown =>
  Reflect.get(element, property);

/** Shared reactive-attrs test harness: mounts MDButton behind a parent whose `v-bind` object can change. */
const DynamicAttrsWrapper = defineComponent({
  components: { MDButton },
  props: {
    attrs: { default: () => ({}), type: Object },
  },
  template: '<MDButton label="Save" v-bind="attrs" />',
});

describe('MDButton adapter', () => {
  it('owns the selected text Button color tokens and private M3E-006 geometry correction', () => {
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
    expect(css).toContain('--m3e-button-small-leading-space: 16px');
    expect(css).toContain('--m3e-button-small-trailing-space: 16px');
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

  it('maps false Boolean values as properties', () => {
    const button = mountButton({ disabled: false }).get('m3e-button');

    expect(getElementProperty(button.element, 'disabled')).toBe(false);
    expect(getElementProperty(button.element, 'toggle')).toBe(false);
    expect(button.attributes('disabled')).toBeUndefined();
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

  describe('host-attribute boundary', () => {
    it('forwards the allowed class/style/id/title/data-*/approved-ARIA attributes to the host', () => {
      const wrapper = mount(MDButton, {
        attrs: {
          'aria-controls': 'menu-1',
          'aria-describedby': 'help-1',
          'aria-expanded': 'true',
          'aria-haspopup': 'menu',
          class: 'consumer-class',
          'data-testid': 'save-button',
          id: 'save-action',
          style: { color: 'red' },
          title: 'Save changes',
        },
        props: { label: 'Save' },
      });
      const button = wrapper.get('m3e-button');

      expect(button.attributes('id')).toBe('save-action');
      expect(button.attributes('title')).toBe('Save changes');
      expect(button.attributes('data-testid')).toBe('save-button');
      expect(button.attributes('aria-controls')).toBe('menu-1');
      expect(button.attributes('aria-describedby')).toBe('help-1');
      expect(button.attributes('aria-expanded')).toBe('true');
      expect(button.attributes('aria-haspopup')).toBe('menu');
    });

    it('merges consumer class/style with the internal md-button class instead of replacing it', () => {
      const wrapper = mount(MDButton, {
        attrs: { class: 'consumer-class', style: { color: 'red' } },
        props: { label: 'Save' },
      });
      const button = wrapper.get('m3e-button');

      expect(button.classes()).toContain('md-button');
      expect(button.classes()).toContain('consumer-class');
      expect(button.attributes('style')).toContain('color: red');
    });

    it('stays reactive to allowed forwarded attribute changes', async () => {
      const wrapper = mount(DynamicAttrsWrapper, { props: { attrs: { id: 'initial-id' } } });
      const button = wrapper.get('m3e-button');
      expect(button.attributes('id')).toBe('initial-id');

      await wrapper.setProps({ attrs: { id: 'updated-id' } });
      expect(button.attributes('id')).toBe('updated-id');
    });

    it('does not forward toggle, selected, shape, renderer type/variant, or an unknown attribute, and adapter-owned bindings win', () => {
      const button = mount(MDButton, {
        attrs: {
          'bogus-consumer-flag': 'leak-attempt',
          selected: true,
          shape: 'square',
          toggle: true,
          type: 'submit',
          variant: 'outlined',
        },
        props: { color: 'filled', label: 'Save', nativeType: 'button' },
      }).get('m3e-button');

      expect(getElementProperty(button.element, 'variant')).toBe('filled');
      expect(getElementProperty(button.element, 'shape')).toBe('rounded');
      expect(getElementProperty(button.element, 'toggle')).toBe(false);
      expect(getElementProperty(button.element, 'selected')).toBe(false);
      expect(getElementProperty(button.element, 'type')).toBe('button');
      expect(button.attributes('bogus-consumer-flag')).toBeUndefined();
    });

    it('does not attach an undeclared beforeinput listener to the host', async () => {
      const onBeforeinput = vi.fn();
      const wrapper = mount(MDButton, {
        attrs: { onBeforeinput },
        props: { label: 'Save' },
      });
      const button = wrapper.get('m3e-button');

      button.element.dispatchEvent(new Event('beforeinput'));
      await wrapper.vm.$nextTick();

      expect(onBeforeinput).not.toHaveBeenCalled();
    });

    it('projects an allow-listed attribute and a data-* key from render-time attrs across add/remove/re-add, and keeps rejecting a dynamically added forbidden attribute/listener', async () => {
      const onBeforeinput = vi.fn();
      const wrapper = mount(DynamicAttrsWrapper, { props: { attrs: {} } });
      const getButton = () => wrapper.get('m3e-button');

      expect(getButton().attributes('id')).toBeUndefined();

      await wrapper.setProps({ attrs: { id: 'first-id' } });
      expect(getButton().attributes('id')).toBe('first-id');

      await wrapper.setProps({ attrs: {} });
      expect(getButton().attributes('id')).toBeUndefined();

      await wrapper.setProps({ attrs: { id: 'second-id' } });
      expect(getButton().attributes('id')).toBe('second-id');

      expect(getButton().attributes('data-testid')).toBeUndefined();
      await wrapper.setProps({ attrs: { 'data-testid': 'save-button', id: 'second-id' } });
      expect(getButton().attributes('data-testid')).toBe('save-button');

      await wrapper.setProps({ attrs: { id: 'second-id' } });
      expect(getButton().attributes('data-testid')).toBeUndefined();

      await wrapper.setProps({ attrs: { id: 'second-id', onBeforeinput, toggle: true } });
      expect(getElementProperty(getButton().element, 'toggle')).toBe(false);
      getButton().element.dispatchEvent(new Event('beforeinput'));
      await wrapper.vm.$nextTick();
      expect(onBeforeinput).not.toHaveBeenCalled();
    });
  });
});
