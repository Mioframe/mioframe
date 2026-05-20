import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextTick } from 'vue';
import MDCheckbox from './MDCheckbox.vue';

const mountCheckbox = (props: Record<string, unknown> = {}) =>
  mount(MDCheckbox, {
    attachTo: document.body,
    props: {
      ariaLabel: 'Enable sync',
      ...props,
    },
    global: {
      stubs: {
        MDPlainTooltip: {
          template: '<span class="md-plain-tooltip-stub" />',
        },
        MDSymbol: {
          template: '<span class="md-symbol-stub" />',
        },
      },
    },
  });

describe('MDCheckbox', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('uses ariaLabel as the focusable container label when tooltip is absent', () => {
    const wrapper = mountCheckbox();

    expect(wrapper.get('.md-checkbox').attributes('aria-label')).toBe('Enable sync');
  });

  it('prefers tooltip over ariaLabel on the focusable container', () => {
    const wrapper = mountCheckbox({
      tooltip: 'Sync with Google Drive',
    });

    expect(wrapper.get('.md-checkbox').attributes('aria-label')).toBe('Sync with Google Drive');
  });

  it('renders a native input in the default interactive mode', () => {
    const wrapper = mountCheckbox({
      modelValue: true,
    });

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(true);
  });

  it('renders a non-interactive aria-hidden checkbox in presentation mode', () => {
    const wrapper = mountCheckbox({
      modelValue: true,
      presentation: true,
    });

    const checkbox = wrapper.get('.md-checkbox');

    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false);
    expect(checkbox.element.tagName).toBe('DIV');
    expect(checkbox.attributes('aria-hidden')).toBe('true');
    expect(checkbox.attributes('tabindex')).toBeUndefined();
    expect(wrapper.find('.md-state-layer').exists()).toBe(false);
  });

  it('does not emit toggle behavior from presentation mode interactions', async () => {
    const wrapper = mountCheckbox({
      modelValue: false,
      presentation: true,
    });

    await wrapper.get('.md-checkbox').trigger('click');
    await wrapper.get('.md-checkbox').trigger('keydown', { key: ' ' });
    await wrapper.get('.md-checkbox').trigger('keydown', { key: 'Enter' });

    expect(wrapper.emitted('click')).toBeUndefined();
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
  });

  it('focuses the host when autofocus is enabled', async () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
    const wrapper = mountCheckbox({
      autofocus: true,
    });
    await nextTick();

    expect(focusSpy).toHaveBeenCalled();
    expect(wrapper.get('.md-checkbox').attributes('tabindex')).toBe('0');
  });

  it('does not autofocus when disabled', () => {
    const wrapper = mountCheckbox({
      autofocus: true,
      disabled: true,
    });

    expect(document.activeElement).not.toBe(wrapper.get('.md-checkbox').element);
  });

  it('stops readonly click activation from bubbling to parent containers', async () => {
    const onParentClick = vi.fn();
    const wrapper = mountCheckbox({
      modelValue: true,
      readonly: true,
    });

    const parent = document.createElement('div');
    parent.addEventListener('click', onParentClick);
    parent.append(wrapper.element);
    document.body.append(parent);

    await wrapper.get('.md-checkbox').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(onParentClick).not.toHaveBeenCalled();
  });

  it('stops readonly keyboard activation from bubbling to parent containers', async () => {
    const parentKeydown = vi.fn();
    const wrapper = mountCheckbox({
      modelValue: true,
      readonly: true,
    });
    const parent = document.createElement('div');
    parent.addEventListener('keydown', parentKeydown);
    parent.append(wrapper.element);
    document.body.append(parent);

    await wrapper.get('.md-checkbox').trigger('keydown', { key: ' ' });

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    expect(parentKeydown).not.toHaveBeenCalled();
  });
});
