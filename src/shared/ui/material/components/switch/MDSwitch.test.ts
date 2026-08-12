import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import MDSwitch from './MDSwitch.vue';
import { installSwitchElementInternalsShim } from './MDSwitch.testUtils';

let restoreElementInternalsShim: () => void;

beforeAll(() => {
  restoreElementInternalsShim = installSwitchElementInternalsShim();
});

afterAll(() => {
  restoreElementInternalsShim();
});

const mountSwitch = (props: Record<string, unknown> = {}) => mount(MDSwitch, { props });

const getElementProperty = (element: Element, property: string): unknown =>
  Reflect.get(element, property);

/**
 * Dispatches a simulated cancelable `beforeinput` intent, matching the installed renderer's own
 * dispatch (`new Event('beforeinput', { bubbles: true, cancelable: true })`).
 * @param element - The `m3e-switch` host element to dispatch the event on.
 * @returns The dispatched event, for inspecting `defaultPrevented` after dispatch.
 */
const dispatchBeforeinput = (element: Element): Event => {
  const event = new Event('beforeinput', { bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event;
};

/** Shared reactive-attrs test harness: mounts MDSwitch behind a parent whose `v-bind` object can change. */
const DynamicAttrsWrapper = defineComponent({
  components: { MDSwitch },
  props: {
    attrs: { default: () => ({}), type: Object },
  },
  template: '<MDSwitch v-bind="attrs" />',
});

describe('MDSwitch adapter', () => {
  it('maps the demand-scoped defaults', () => {
    const el = mountSwitch().get('m3e-switch');

    expect(getElementProperty(el.element, 'checked')).toBe(false);
    expect(getElementProperty(el.element, 'disabled')).toBe(false);
    expect(el.attributes('tabindex')).toBeUndefined();
    expect(el.attributes('aria-hidden')).toBeUndefined();
    expect(el.classes()).not.toContain('md-switch_presentation');
  });

  it('maps explicit selected and disabled as Boolean properties, not dashed present/absent attributes', () => {
    const el = mountSwitch({ disabled: true, selected: true }).get('m3e-switch');

    expect(getElementProperty(el.element, 'checked')).toBe(true);
    expect(getElementProperty(el.element, 'disabled')).toBe(true);
  });

  it('maps false Boolean values as properties', () => {
    const el = mountSwitch({ disabled: false, selected: false }).get('m3e-switch');

    expect(getElementProperty(el.element, 'checked')).toBe(false);
    expect(getElementProperty(el.element, 'disabled')).toBe(false);
  });

  it('re-controls the renderer checked property when the selected prop changes', async () => {
    const wrapper = mountSwitch({ selected: false });
    const el = wrapper.get('m3e-switch');

    await wrapper.setProps({ selected: true });

    expect(getElementProperty(el.element, 'checked')).toBe(true);
  });

  describe('controlled selection intent', () => {
    it('emits update:selected once, derived from a cancelable beforeinput intent computed before any renderer mutation', async () => {
      const wrapper = mountSwitch({ selected: false });
      const el = wrapper.get('m3e-switch');

      const event = dispatchBeforeinput(el.element);
      await wrapper.vm.$nextTick();

      expect(event.defaultPrevented).toBe(true);
      expect(wrapper.emitted('update:selected')).toEqual([[true]]);
    });

    it('computes the intended value as the negation of the current checked value', async () => {
      const wrapper = mountSwitch({ selected: true });
      const el = wrapper.get('m3e-switch');

      dispatchBeforeinput(el.element);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:selected')).toEqual([[false]]);
    });

    it('rejected intent: leaves the rendered checked unchanged when the emitted value is not written back to selected', async () => {
      const wrapper = mountSwitch({ selected: false });
      const el = wrapper.get('m3e-switch');

      dispatchBeforeinput(el.element);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:selected')).toEqual([[true]]);
      // The controlling `selected` prop was intentionally never updated with the emitted value.
      expect(getElementProperty(el.element, 'checked')).toBe(false);
    });

    it("does not emit while disabled, relying on the renderer's own click guard blocking beforeinput dispatch before the adapter's listener could run", async () => {
      const wrapper = mountSwitch({ disabled: true, selected: false });
      const el = wrapper.get('m3e-switch');

      el.element.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:selected')).toBeUndefined();
    });
  });

  describe('presentation', () => {
    it('fully suppresses interactivity at the host regardless of selected/disabled', () => {
      const el = mountSwitch({ presentation: true, selected: true }).get('m3e-switch');

      expect(el.attributes('tabindex')).toBe('-1');
      expect(el.attributes('aria-hidden')).toBe('true');
      expect(el.classes()).toContain('md-switch_presentation');
      // The visual still reflects selected/disabled while presentation is true.
      expect(getElementProperty(el.element, 'checked')).toBe(true);
    });

    it('does not call preventDefault or emit update:selected from a cancelable beforeinput while presentation is true', async () => {
      const wrapper = mountSwitch({ presentation: true, selected: false });
      const el = wrapper.get('m3e-switch');

      const event = dispatchBeforeinput(el.element);
      await wrapper.vm.$nextTick();

      expect(event.defaultPrevented).toBe(false);
      expect(wrapper.emitted('update:selected')).toBeUndefined();
    });
  });

  describe('host-attribute boundary', () => {
    it('forwards the allowed class/style/id/title/data-*/aria-label/aria-labelledby attributes', () => {
      const wrapper = mount(MDSwitch, {
        attrs: {
          'aria-label': 'Automatic updates',
          'aria-labelledby': 'label-1',
          class: 'consumer-class',
          'data-testid': 'auto-update-switch',
          id: 'auto-update',
          style: { color: 'red' },
          title: 'Automatic updates',
        },
      });
      const el = wrapper.get('m3e-switch');

      expect(el.attributes('id')).toBe('auto-update');
      expect(el.attributes('title')).toBe('Automatic updates');
      expect(el.attributes('data-testid')).toBe('auto-update-switch');
      expect(el.attributes('aria-label')).toBe('Automatic updates');
      expect(el.attributes('aria-labelledby')).toBe('label-1');
    });

    it('merges consumer class/style with the internal md-switch class instead of replacing it', () => {
      const wrapper = mount(MDSwitch, {
        attrs: { class: 'consumer-class', style: { color: 'red' } },
      });
      const el = wrapper.get('m3e-switch');

      expect(el.classes()).toContain('md-switch');
      expect(el.classes()).toContain('consumer-class');
      expect(el.attributes('style')).toContain('color: red');
    });

    it('stays reactive to allowed forwarded attribute changes', async () => {
      const wrapper = mount(DynamicAttrsWrapper, { props: { attrs: { id: 'initial-id' } } });
      const getSwitch = () => wrapper.get('m3e-switch');

      expect(getSwitch().attributes('id')).toBe('initial-id');

      await wrapper.setProps({ attrs: { id: 'updated-id' } });
      expect(getSwitch().attributes('id')).toBe('updated-id');

      await wrapper.setProps({ attrs: {} });
      expect(getSwitch().attributes('id')).toBeUndefined();
    });

    it('does not forward icons, name, value, raw checked, or an unknown attribute, and adapter-owned bindings win', () => {
      const el = mount(MDSwitch, {
        attrs: {
          'bogus-consumer-flag': 'leak-attempt',
          checked: true,
          icons: 'both',
          name: 'bogus-name',
          value: 'bogus-value',
        },
        props: { selected: false },
      }).get('m3e-switch');

      expect(getElementProperty(el.element, 'checked')).toBe(false);
      expect(getElementProperty(el.element, 'icons')).toBe('none');
      expect(getElementProperty(el.element, 'name')).toBe('');
      expect(getElementProperty(el.element, 'value')).toBe('on');
      expect(el.attributes('bogus-consumer-flag')).toBeUndefined();
    });

    it('rejects duplicate consumer beforeinput/change/click listeners at the host-attribute boundary', async () => {
      const onClick = vi.fn();
      const onBeforeinput = vi.fn();
      const onChange = vi.fn();
      const wrapper = mount(MDSwitch, { attrs: { onBeforeinput, onChange, onClick } });
      const el = wrapper.get('m3e-switch');

      el.element.dispatchEvent(new Event('click'));
      dispatchBeforeinput(el.element);
      el.element.dispatchEvent(new Event('change'));
      await wrapper.vm.$nextTick();

      expect(onClick).not.toHaveBeenCalled();
      expect(onBeforeinput).not.toHaveBeenCalled();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('projects an allow-listed attribute from render-time attrs across add/remove/re-add, and keeps rejecting a dynamically added forbidden attribute/listener', async () => {
      const onClick = vi.fn();
      const wrapper = mount(DynamicAttrsWrapper, { props: { attrs: {} } });
      const getSwitch = () => wrapper.get('m3e-switch');

      expect(getSwitch().attributes('data-testid')).toBeUndefined();

      await wrapper.setProps({ attrs: { 'data-testid': 'first-id' } });
      expect(getSwitch().attributes('data-testid')).toBe('first-id');

      await wrapper.setProps({ attrs: {} });
      expect(getSwitch().attributes('data-testid')).toBeUndefined();

      await wrapper.setProps({ attrs: { 'data-testid': 'second-id', icons: 'both', onClick } });
      expect(getSwitch().attributes('data-testid')).toBe('second-id');
      expect(getElementProperty(getSwitch().element, 'icons')).toBe('none');
      getSwitch().element.dispatchEvent(new Event('click'));
      await wrapper.vm.$nextTick();
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
