import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import MDListItem from './MDListItem.vue';

const mountListItem = (props: Record<string, unknown> = {}, attrs: Record<string, unknown> = {}) =>
  mount(MDListItem, {
    attachTo: document.body,
    props: {
      headline: 'Settings',
      supportingText: 'System preferences',
      ...props,
    },
    attrs,
  });

describe('MDListItem', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('keeps button hosts free of nested interactive descendants and divs', () => {
    const wrapper = mountListItem({
      is: 'button',
      type: 'button',
    });
    const button = wrapper.get('button');

    expect(button.find('button').exists()).toBe(false);
    expect(button.find('div').exists()).toBe(false);
    expect(button.find('input, select, textarea, a[href], [role="button"]').exists()).toBe(false);
  });

  it('does not emit click from a disabled button host', async () => {
    const wrapper = mountListItem({
      is: 'button',
      type: 'button',
      disabled: true,
    });

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('click')).toBeUndefined();
    expect(document.body.querySelector('.md-ripple')).toBeNull();
  });

  it('prevents disabled anchor activation and removes it from tab order', () => {
    const wrapper = mountListItem({
      is: 'a',
      disabled: true,
    });
    const anchor = wrapper.get('a');
    const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });
    const keydownEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
    });

    anchor.element.dispatchEvent(clickEvent);
    anchor.element.dispatchEvent(keydownEvent);

    expect(clickEvent.defaultPrevented).toBe(true);
    expect(keydownEvent.defaultPrevented).toBe(true);
    expect(anchor.attributes('aria-disabled')).toBe('true');
    expect(anchor.attributes('tabindex')).toBe('-1');
    expect(wrapper.emitted('click')).toBeUndefined();
    expect(wrapper.emitted('keydown')).toBeUndefined();
    expect(document.body.querySelector('.md-ripple')).toBeNull();
  });

  it('does not expose active state classes or draggable state when disabled', async () => {
    const wrapper = mountListItem(
      {
        is: 'div',
        disabled: true,
        draggable: true,
      },
      { tabindex: '0' },
    );

    expect(wrapper.classes()).toContain('md-state_disabled');
    expect(wrapper.classes()).not.toContain('md-state_hover');
    expect(wrapper.classes()).not.toContain('md-state_focused');
    expect(wrapper.classes()).not.toContain('md-state_pressed');
    expect(wrapper.classes()).not.toContain('md-state_dragged');
    expect(wrapper.attributes('aria-disabled')).toBe('true');
    expect(wrapper.attributes('tabindex')).toBe('-1');
    expect(wrapper.attributes('draggable')).toBeUndefined();

    await wrapper.trigger('dragstart');

    expect(wrapper.classes()).not.toContain('md-state_dragged');
    expect(document.body.querySelector('.md-ripple')).toBeNull();
  });
});
