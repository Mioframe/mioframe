import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import MDCheckbox from './MDCheckbox.vue';
import { installCheckboxElementInternalsShim } from './MDCheckbox.testUtils';

let restoreElementInternalsShim: () => void;

beforeAll(() => {
  restoreElementInternalsShim = installCheckboxElementInternalsShim();
});

afterAll(() => {
  restoreElementInternalsShim();
});

const mountCheckbox = (props: Record<string, unknown> = {}) => mount(MDCheckbox, { props });

const getElementProperty = (element: Element, property: string): unknown =>
  Reflect.get(element, property);

/**
 * Dispatches a simulated cancelable `beforeinput` intent, matching the installed renderer's own
 * dispatch (`new Event('beforeinput', { bubbles: true, cancelable: true })`).
 * @param element - The `m3e-checkbox` host element to dispatch the event on.
 * @returns The dispatched event, for inspecting `defaultPrevented` after dispatch.
 */
const dispatchBeforeinput = (element: Element): Event => {
  const event = new Event('beforeinput', { bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event;
};

/** Shared reactive-attrs test harness: mounts MDCheckbox behind a parent whose `v-bind` object can change. */
const DynamicAttrsWrapper = defineComponent({
  components: { MDCheckbox },
  props: {
    attrs: { default: () => ({}), type: Object },
  },
  template: '<MDCheckbox v-bind="attrs" />',
});

describe('MDCheckbox adapter', () => {
  it('maps the demand-scoped defaults', () => {
    const el = mountCheckbox().get('m3e-checkbox');

    expect(getElementProperty(el.element, 'checked')).toBe(false);
    expect(getElementProperty(el.element, 'indeterminate')).toBe(false);
    expect(getElementProperty(el.element, 'disabled')).toBe(false);
    expect(el.attributes('tabindex')).toBeUndefined();
    expect(el.attributes('aria-hidden')).toBeUndefined();
    expect(el.classes()).not.toContain('md-checkbox_presentation');
  });

  it('maps explicit checked, indeterminate, and disabled as Boolean properties, not dashed present/absent attributes', () => {
    const el = mountCheckbox({ checked: true, disabled: true, indeterminate: true }).get(
      'm3e-checkbox',
    );

    expect(getElementProperty(el.element, 'checked')).toBe(true);
    expect(getElementProperty(el.element, 'indeterminate')).toBe(true);
    expect(getElementProperty(el.element, 'disabled')).toBe(true);
  });

  it('maps false Boolean values as properties', () => {
    const el = mountCheckbox({ checked: false, disabled: false, indeterminate: false }).get(
      'm3e-checkbox',
    );

    expect(getElementProperty(el.element, 'checked')).toBe(false);
    expect(getElementProperty(el.element, 'indeterminate')).toBe(false);
    expect(getElementProperty(el.element, 'disabled')).toBe(false);
  });

  it('re-controls the renderer checked/indeterminate properties when the props change', async () => {
    const wrapper = mountCheckbox({ checked: false, indeterminate: true });
    const el = wrapper.get('m3e-checkbox');

    await wrapper.setProps({ checked: true, indeterminate: false });

    expect(getElementProperty(el.element, 'checked')).toBe(true);
    expect(getElementProperty(el.element, 'indeterminate')).toBe(false);
  });

  describe('controlled selection intent', () => {
    it('emits update:checked and update:indeterminate once each, derived from a cancelable beforeinput intent computed before any renderer mutation', async () => {
      const wrapper = mountCheckbox({ checked: false });
      const el = wrapper.get('m3e-checkbox');

      const event = dispatchBeforeinput(el.element);
      await wrapper.vm.$nextTick();

      expect(event.defaultPrevented).toBe(true);
      expect(wrapper.emitted('update:checked')).toEqual([[true]]);
      expect(wrapper.emitted('update:indeterminate')).toEqual([[false]]);
    });

    it('computes the intended checked value as the negation of the current checked value', async () => {
      const wrapper = mountCheckbox({ checked: true });
      const el = wrapper.get('m3e-checkbox');

      dispatchBeforeinput(el.element);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:checked')).toEqual([[false]]);
    });

    it('always computes the intended indeterminate value as false, regardless of the pre-activation value', async () => {
      const wrapper = mountCheckbox({ checked: false, indeterminate: true });
      const el = wrapper.get('m3e-checkbox');

      dispatchBeforeinput(el.element);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:indeterminate')).toEqual([[false]]);
    });

    it('rejected intent: leaves the rendered checked/indeterminate unchanged when the emitted values are not written back', async () => {
      const wrapper = mountCheckbox({ checked: false, indeterminate: true });
      const el = wrapper.get('m3e-checkbox');

      dispatchBeforeinput(el.element);
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:checked')).toEqual([[true]]);
      expect(wrapper.emitted('update:indeterminate')).toEqual([[false]]);
      // The controlling `checked`/`indeterminate` props were intentionally never updated with the
      // emitted values.
      expect(getElementProperty(el.element, 'checked')).toBe(false);
      expect(getElementProperty(el.element, 'indeterminate')).toBe(true);
    });

    it("does not emit while disabled, relying on the renderer's own click guard blocking beforeinput dispatch before the adapter's listener could run", async () => {
      const wrapper = mountCheckbox({ checked: false, disabled: true });
      const el = wrapper.get('m3e-checkbox');

      el.element.dispatchEvent(new Event('click', { bubbles: true, cancelable: true }));
      await wrapper.vm.$nextTick();

      expect(wrapper.emitted('update:checked')).toBeUndefined();
      expect(wrapper.emitted('update:indeterminate')).toBeUndefined();
    });
  });

  describe('presentation', () => {
    it('fully suppresses interactivity at the host regardless of checked/indeterminate/disabled', () => {
      const el = mountCheckbox({ checked: true, presentation: true }).get('m3e-checkbox');

      expect(el.attributes('tabindex')).toBe('-1');
      expect(el.attributes('aria-hidden')).toBe('true');
      expect(el.classes()).toContain('md-checkbox_presentation');
      // The visual still reflects checked/indeterminate while presentation is true.
      expect(getElementProperty(el.element, 'checked')).toBe(true);
    });

    it('does not call preventDefault or emit update:checked/update:indeterminate from a cancelable beforeinput while presentation is true', async () => {
      const wrapper = mountCheckbox({ checked: false, presentation: true });
      const el = wrapper.get('m3e-checkbox');

      const event = dispatchBeforeinput(el.element);
      await wrapper.vm.$nextTick();

      expect(event.defaultPrevented).toBe(false);
      expect(wrapper.emitted('update:checked')).toBeUndefined();
      expect(wrapper.emitted('update:indeterminate')).toBeUndefined();
    });
  });

  describe('host-attribute boundary', () => {
    it('forwards the allowed class/style/id/title/data-*/aria-label/aria-labelledby attributes', () => {
      const wrapper = mount(MDCheckbox, {
        attrs: {
          'aria-label': 'Select item',
          'aria-labelledby': 'label-1',
          class: 'consumer-class',
          'data-testid': 'select-item-checkbox',
          id: 'select-item',
          style: { color: 'red' },
          title: 'Select item',
        },
      });
      const el = wrapper.get('m3e-checkbox');

      expect(el.attributes('id')).toBe('select-item');
      expect(el.attributes('title')).toBe('Select item');
      expect(el.attributes('data-testid')).toBe('select-item-checkbox');
      expect(el.attributes('aria-label')).toBe('Select item');
      expect(el.attributes('aria-labelledby')).toBe('label-1');
    });

    it('merges consumer class/style with the internal md-checkbox class instead of replacing it', () => {
      const wrapper = mount(MDCheckbox, {
        attrs: { class: 'consumer-class', style: { color: 'red' } },
      });
      const el = wrapper.get('m3e-checkbox');

      expect(el.classes()).toContain('md-checkbox');
      expect(el.classes()).toContain('consumer-class');
      expect(el.attributes('style')).toContain('color: red');
    });

    it('stays reactive to allowed forwarded attribute changes', async () => {
      const wrapper = mount(DynamicAttrsWrapper, { props: { attrs: { id: 'initial-id' } } });
      const getCheckbox = () => wrapper.get('m3e-checkbox');

      expect(getCheckbox().attributes('id')).toBe('initial-id');

      await wrapper.setProps({ attrs: { id: 'updated-id' } });
      expect(getCheckbox().attributes('id')).toBe('updated-id');

      await wrapper.setProps({ attrs: {} });
      expect(getCheckbox().attributes('id')).toBeUndefined();
    });

    it('does not forward name, value, required, or an unknown attribute, and adapter-owned bindings win', () => {
      // `checked`/`indeterminate` are themselves the declared public props (unlike Switch, whose
      // public prop `selected` is a distinct name from the renderer's `checked`), so Vue's own
      // prop resolution already routes those names to props rather than `$attrs` before the
      // adapter's allow-list ever runs; that one-directional controlled contract is proven by
      // the "maps explicit checked/indeterminate" tests above, not here.
      const el = mount(MDCheckbox, {
        attrs: {
          'bogus-consumer-flag': 'leak-attempt',
          name: 'bogus-name',
          required: true,
          value: 'bogus-value',
        },
        props: { checked: false },
      }).get('m3e-checkbox');

      expect(getElementProperty(el.element, 'checked')).toBe(false);
      expect(getElementProperty(el.element, 'name')).toBe('');
      expect(getElementProperty(el.element, 'required')).toBe(false);
      expect(getElementProperty(el.element, 'value')).toBe('on');
      expect(el.attributes('bogus-consumer-flag')).toBeUndefined();
    });

    it('rejects duplicate consumer beforeinput/change/click listeners at the host-attribute boundary', async () => {
      const onClick = vi.fn();
      const onBeforeinput = vi.fn();
      const onChange = vi.fn();
      const wrapper = mount(MDCheckbox, { attrs: { onBeforeinput, onChange, onClick } });
      const el = wrapper.get('m3e-checkbox');

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
      const getCheckbox = () => wrapper.get('m3e-checkbox');

      expect(getCheckbox().attributes('data-testid')).toBeUndefined();

      await wrapper.setProps({ attrs: { 'data-testid': 'first-id' } });
      expect(getCheckbox().attributes('data-testid')).toBe('first-id');

      await wrapper.setProps({ attrs: {} });
      expect(getCheckbox().attributes('data-testid')).toBeUndefined();

      await wrapper.setProps({
        attrs: { 'data-testid': 'second-id', name: 'bogus-name', onClick },
      });
      expect(getCheckbox().attributes('data-testid')).toBe('second-id');
      expect(getElementProperty(getCheckbox().element, 'name')).toBe('');
      getCheckbox().element.dispatchEvent(new Event('click'));
      await wrapper.vm.$nextTick();
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
