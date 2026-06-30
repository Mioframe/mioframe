import { mount } from '@vue/test-utils';
import { readFileSync } from 'node:fs';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import MDSwitch from './MDSwitch.vue';

// jsdom does not implement Element.animate, which the shared ripple effect calls on
// pointer/keyboard activation. Stub it so ripple activation in these tests does not
// reject asynchronously with an unhandled rejection.
beforeAll(() => {
  if (typeof Element.prototype.animate !== 'function') {
    Object.defineProperty(Element.prototype, 'animate', {
      configurable: true,
      value: () => ({ addEventListener: () => undefined, effect: null, playbackRate: 1 }),
    });
  }
});

const mountSwitch = (props: Record<string, unknown> = {}) =>
  mount(MDSwitch, {
    attachTo: document.body,
    props: {
      ariaLabel: 'Error diagnostics',
      ...props,
    },
  });

describe('MDSwitch', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses ariaLabel as the focusable host label', () => {
    const wrapper = mountSwitch();

    expect(wrapper.get('.md-switch').attributes('aria-label')).toBe('Error diagnostics');
  });

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

  it('maps switch state-layer colors into the generic MDStateLayer private variable', () => {
    const source = readFileSync('src/shared/ui/Switch/MDSwitch.vue', 'utf8');

    expect(source).toContain(
      '--md-private-state-layer-color: var(--md-comp-switch-unselected-hover-state-layer-color);',
    );
    expect(source).toContain(
      '--md-private-state-layer-color: var(--md-comp-switch-selected-hover-state-layer-color);',
    );
    expect(source).toContain(
      '--md-private-state-layer-color: var(--md-comp-switch-unselected-focus-state-layer-color);',
    );
    expect(source).toContain(
      '--md-private-state-layer-color: var(--md-comp-switch-selected-focus-state-layer-color);',
    );
    expect(source).toContain(
      '--md-private-state-layer-color: var(--md-comp-switch-unselected-pressed-state-layer-color);',
    );
    expect(source).toContain(
      '--md-private-state-layer-color: var(--md-comp-switch-selected-pressed-state-layer-color);',
    );
    expect(source).not.toContain('--md-private-switch-state-layer-color');
  });
});
