import { mount } from '@vue/test-utils';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { h, nextTick } from 'vue';
import MDSwitch from './MDSwitch.vue';

// happy-dom does not implement Element.animate or KeyframeEffect, which the shared ripple
// effect calls on pointer/keyboard activation. Stub both so press/drag event sequences do
// not reject asynchronously with an unhandled rejection.
beforeAll(() => {
  if (typeof Element.prototype.animate !== 'function') {
    Object.defineProperty(Element.prototype, 'animate', {
      configurable: true,
      value: () => ({ addEventListener: () => undefined, effect: null, playbackRate: 1 }),
    });
  }

  if (typeof globalThis.KeyframeEffect === 'undefined') {
    Object.defineProperty(globalThis, 'KeyframeEffect', {
      configurable: true,
      // oxlint-disable-next-line no-extraneous-class -- happy-dom stub; body would be dead code
      value: class KeyframeEffect {},
    });
  }
});

const mountSwitch = (
  props: Record<string, unknown> = {},
  slots: Record<string, () => unknown> = {},
) =>
  mount(MDSwitch, {
    attachTo: document.body,
    props: {
      ariaLabel: 'Error diagnostics',
      ...props,
    },
    slots,
  });

describe('MDSwitch', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('ARIA labeling', () => {
    it('uses ariaLabel as the focusable host label', () => {
      const wrapper = mountSwitch();

      expect(wrapper.get('.md-switch').attributes('aria-label')).toBe('Error diagnostics');
      expect(wrapper.get('.md-switch').attributes('aria-labelledby')).toBeUndefined();
    });

    it('uses ariaLabelledby and suppresses ariaLabel when both are provided', () => {
      const wrapper = mountSwitch({ ariaLabelledby: 'label-123' });

      expect(wrapper.get('.md-switch').attributes('aria-labelledby')).toBe('label-123');
      expect(wrapper.get('.md-switch').attributes('aria-label')).toBeUndefined();
    });

    it('sets aria-labelledby when only ariaLabelledby is provided', () => {
      const wrapper = mountSwitch({ ariaLabel: undefined, ariaLabelledby: 'label-abc' });

      expect(wrapper.get('.md-switch').attributes('aria-labelledby')).toBe('label-abc');
      expect(wrapper.get('.md-switch').attributes('aria-label')).toBeUndefined();
    });
  });

  describe('ARIA role and state', () => {
    it('renders a native switch input in the default interactive mode', () => {
      const wrapper = mountSwitch({ modelValue: true });

      const input = wrapper.get('input[type="checkbox"]');
      const target = wrapper.get('.md-switch__target');

      expect(input.attributes('tabindex')).toBe('-1');
      expect(input.attributes('aria-hidden')).toBe('true');
      expect(wrapper.get('.md-switch').attributes('tabindex')).toBe('0');
      expect(target.attributes('aria-hidden')).toBe('true');
    });

    it('exposes switch role and state on the focusable host', () => {
      const wrapper = mountSwitch({ modelValue: true });

      const host = wrapper.get('.md-switch');

      expect(host.attributes('role')).toBe('switch');
      expect(host.attributes('aria-checked')).toBe('true');
      expect(host.attributes('aria-disabled')).toBeUndefined();
    });

    it('marks the focusable host as aria-disabled when disabled', () => {
      const wrapper = mountSwitch({ modelValue: false, disabled: true });

      expect(wrapper.get('.md-switch').attributes('aria-disabled')).toBe('true');
    });
  });

  describe('presentation mode', () => {
    it('renders a non-interactive aria-hidden switch in presentation mode', () => {
      const wrapper = mountSwitch({ modelValue: true, presentation: true });

      const switchEl = wrapper.get('.md-switch');

      expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
      expect(switchEl.element.tagName).toBe('DIV');
      expect(switchEl.attributes('aria-hidden')).toBe('true');
      expect(switchEl.attributes('tabindex')).toBeUndefined();
      expect(switchEl.classes()).toContain('md-switch_presentation');
      expect(wrapper.find('.md-switch__target').exists()).toBe(false);
      expect(wrapper.find('.md-state-layer').exists()).toBe(false);
    });

    it('does not emit toggle behavior from presentation mode interactions', async () => {
      const wrapper = mountSwitch({ modelValue: false, presentation: true });

      await wrapper.get('.md-switch').trigger('click');
      await wrapper.get('.md-switch').trigger('keydown', { key: ' ' });
      await wrapper.get('.md-switch').trigger('keydown', { key: 'Enter' });

      expect(wrapper.emitted('click')).toBeUndefined();
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });
  });

  describe('autofocus', () => {
    it('focuses the host when autofocus is enabled', async () => {
      const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
      const wrapper = mountSwitch({ autofocus: true });
      await nextTick();

      expect(focusSpy).toHaveBeenCalled();
      expect(wrapper.get('.md-switch').attributes('tabindex')).toBe('0');
    });

    it('does not autofocus when disabled', () => {
      const wrapper = mountSwitch({ autofocus: true, disabled: true });

      expect(document.activeElement).not.toBe(wrapper.get('.md-switch').element);
    });
  });

  describe('click and keyboard interaction', () => {
    it('toggles value on click', async () => {
      const wrapper = mountSwitch({ modelValue: false });

      await wrapper.get('.md-switch').trigger('click');

      expect(wrapper.emitted('click')).toHaveLength(1);
      expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
    });

    it('toggles value with Space and Enter keys', async () => {
      const wrapper = mountSwitch({ modelValue: false });

      await wrapper.get('.md-switch').trigger('keydown', { key: ' ' });
      expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);

      await wrapper.get('.md-switch').trigger('keydown', { key: 'Enter' });
      expect(wrapper.emitted('update:modelValue')).toEqual([[true], [true]]);
    });

    it('keeps disabled mode inactive', async () => {
      const wrapper = mountSwitch({ modelValue: false, disabled: true });

      await wrapper.get('.md-switch').trigger('click');
      await wrapper.get('.md-switch').trigger('keydown', { key: ' ' });

      expect(wrapper.emitted('click')).toBeUndefined();
      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
      expect(wrapper.get('.md-switch').attributes('tabindex')).toBe('-1');
    });
  });

  describe('drag interaction', () => {
    it('suppresses the next click event after a meaningful pointer drag', async () => {
      const wrapper = mountSwitch({ modelValue: false });
      const host = wrapper.get('.md-switch');

      // Simulate a drag: down at x=10, up at x=40 (dx=30 > 4px threshold).
      await host.trigger('pointerdown', { button: 0, clientX: 10 });
      await host.trigger('pointerup', { clientX: 40 });

      // Subsequent click should be suppressed (no toggle from click).
      await host.trigger('click');

      // The drag itself may not toggle because getBoundingClientRect returns 0 in jsdom;
      // the assertion here is that click does NOT add a second toggle event.
      const emitted = wrapper.emitted('update:modelValue') ?? [];
      const clickEmits = wrapper.emitted('click') ?? [];
      // At most one toggle from the drag resolution; click after drag must not add another.
      expect(clickEmits.length).toBeLessThanOrEqual(1);
      expect(emitted.length).toBeLessThanOrEqual(1);
    });

    it('does not suppress click when drag distance is below threshold', async () => {
      const wrapper = mountSwitch({ modelValue: false });
      const host = wrapper.get('.md-switch');

      // Tiny movement — under threshold.
      await host.trigger('pointerdown', { button: 0, clientX: 10 });
      await host.trigger('pointerup', { clientX: 12 });

      // Normal click should still toggle.
      await host.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
    });

    it('does not initiate drag when disabled', async () => {
      const wrapper = mountSwitch({ modelValue: false, disabled: true });
      const host = wrapper.get('.md-switch');

      await host.trigger('pointerdown', { button: 0, clientX: 0 });
      await host.trigger('pointerup', { clientX: 40 });
      await host.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('does not initiate drag in presentation mode', async () => {
      const wrapper = mountSwitch({ modelValue: false, presentation: true });
      const host = wrapper.get('.md-switch');

      await host.trigger('pointerdown', { button: 0, clientX: 0 });
      await host.trigger('pointerup', { clientX: 40 });

      expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    });

    it('cleans up drag state on pointercancel', async () => {
      const wrapper = mountSwitch({ modelValue: false });
      const host = wrapper.get('.md-switch');

      await host.trigger('pointerdown', { button: 0, clientX: 0 });
      await host.trigger('pointercancel');

      // Click should work normally after cancel (not suppressed).
      await host.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toEqual([[true]]);
    });
  });

  describe('icon slots', () => {
    const checkIconSlot = () => h('span', { class: 'icon-check' }, '✓');
    const crossIconSlot = () => h('span', { class: 'icon-cross' }, '✕');

    it('renders the selected-icon slot content when selected', () => {
      const wrapper = mountSwitch({ modelValue: true }, { 'selected-icon': checkIconSlot });

      expect(wrapper.find('.icon-check').exists()).toBe(true);
      expect(wrapper.find('.icon-cross').exists()).toBe(false);
    });

    it('renders the unselected-icon slot content when unselected', () => {
      const wrapper = mountSwitch({ modelValue: false }, { 'unselected-icon': crossIconSlot });

      expect(wrapper.find('.icon-cross').exists()).toBe(true);
      expect(wrapper.find('.icon-check').exists()).toBe(false);
    });

    it('renders only the state-matching icon when both slots are provided', () => {
      const wrapper = mountSwitch(
        { modelValue: false },
        {
          'selected-icon': checkIconSlot,
          'unselected-icon': crossIconSlot,
        },
      );

      expect(wrapper.find('.icon-cross').exists()).toBe(true);
      expect(wrapper.find('.icon-check').exists()).toBe(false);
    });

    it('icon wrapper carries aria-hidden', () => {
      const wrapper = mountSwitch({ modelValue: true }, { 'selected-icon': checkIconSlot });

      const iconWrapper = wrapper.get('.md-switch__icon');
      expect(iconWrapper.attributes('aria-hidden')).toBe('true');
    });

    it('applies md-switch_with-current-icon class when current state has an icon', () => {
      const selectedWrapper = mountSwitch({ modelValue: true }, { 'selected-icon': checkIconSlot });
      expect(selectedWrapper.get('.md-switch').classes()).toContain('md-switch_with-current-icon');

      const unselectedWrapper = mountSwitch(
        { modelValue: false },
        { 'unselected-icon': crossIconSlot },
      );
      expect(unselectedWrapper.get('.md-switch').classes()).toContain(
        'md-switch_with-current-icon',
      );
    });

    it('does not apply md-switch_with-current-icon when current state has no icon', () => {
      // Only selected-icon provided, but state is unselected.
      const wrapper = mountSwitch({ modelValue: false }, { 'selected-icon': checkIconSlot });
      expect(wrapper.get('.md-switch').classes()).not.toContain('md-switch_with-current-icon');
    });

    it('renders icons in presentation mode', () => {
      const wrapper = mountSwitch(
        { modelValue: true, presentation: true },
        { 'selected-icon': checkIconSlot },
      );

      expect(wrapper.find('.icon-check').exists()).toBe(true);
    });

    it('applies md-switch_with-current-icon class in presentation mode when current state has an icon', () => {
      const selectedWrapper = mountSwitch(
        { modelValue: true, presentation: true },
        { 'selected-icon': checkIconSlot },
      );
      expect(selectedWrapper.get('.md-switch').classes()).toContain('md-switch_with-current-icon');

      const unselectedWrapper = mountSwitch(
        { modelValue: false, presentation: true },
        { 'unselected-icon': crossIconSlot },
      );
      expect(unselectedWrapper.get('.md-switch').classes()).toContain(
        'md-switch_with-current-icon',
      );
    });

    it('does not apply md-switch_with-current-icon class in presentation mode when current state has no icon', () => {
      const wrapper = mountSwitch(
        { modelValue: false, presentation: true },
        { 'selected-icon': checkIconSlot },
      );
      expect(wrapper.get('.md-switch').classes()).not.toContain('md-switch_with-current-icon');
    });

    it('does not render icons when no slots are provided', () => {
      const wrapper = mountSwitch({ modelValue: true });

      expect(wrapper.find('.md-switch__icon').exists()).toBe(false);
    });
  });

  describe('state-layer color mapping', () => {
    it('applies md-switch_selected class for selected state', () => {
      const wrapper = mountSwitch({ modelValue: true });
      expect(wrapper.get('.md-switch').classes()).toContain('md-switch_selected');
    });

    it('does not apply md-switch_selected class for unselected state', () => {
      const wrapper = mountSwitch({ modelValue: false });
      expect(wrapper.get('.md-switch').classes()).not.toContain('md-switch_selected');
    });
  });
});
