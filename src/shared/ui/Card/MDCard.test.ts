import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDCard from './MDCard.vue';

describe('MDCard', () => {
  it('defaults to the filled variant and static mode', () => {
    const wrapper = mount(MDCard, { slots: { default: 'Content' } });

    expect(wrapper.classes()).toContain('md-card_variant_filled');
    expect(wrapper.classes()).toContain('md-card_mode_static');
    expect(wrapper.element.tagName.toLowerCase()).toBe('div');
  });

  it.each(['elevated', 'filled', 'outlined'] as const)(
    'applies the %s variant modifier class',
    (variant) => {
      const wrapper = mount(MDCard, { props: { variant } });

      expect(wrapper.classes()).toContain(`md-card_variant_${variant}`);
    },
  );

  it('renders a non-actionable static card with no role, tabindex, or state layer', async () => {
    const wrapper = mount(MDCard, { slots: { default: 'Content' } });

    expect(wrapper.attributes('role')).toBeUndefined();
    expect(wrapper.attributes('tabindex')).toBeUndefined();
    expect(wrapper.findComponent({ name: 'MDStateLayer' }).exists()).toBe(false);

    await wrapper.trigger('click');

    expect(wrapper.emitted('action')).toBeUndefined();
  });

  it('renders a native button, sets its type, emits action, and respects disabled', async () => {
    const wrapper = mount(MDCard, {
      props: { mode: 'button', nativeType: 'submit' },
    });

    expect(wrapper.element.tagName.toLowerCase()).toBe('button');
    expect(wrapper.attributes('type')).toBe('submit');

    await wrapper.trigger('click');
    expect(wrapper.emitted('action')).toHaveLength(1);

    await wrapper.setProps({ disabled: true });
    expect(wrapper.attributes('disabled')).toBeDefined();

    await wrapper.trigger('click');
    expect(wrapper.emitted('action')).toHaveLength(1);
  });

  it('renders a native anchor, sets href, and emits action on click', async () => {
    const wrapper = mount(MDCard, {
      props: { mode: 'link', href: '/example' },
    });

    expect(wrapper.element.tagName.toLowerCase()).toBe('a');
    expect(wrapper.attributes('href')).toBe('/example');

    await wrapper.trigger('click');
    expect(wrapper.emitted('action')).toHaveLength(1);
  });

  it('blocks navigation and action on a disabled link via aria-disabled and tabindex', async () => {
    const wrapper = mount(MDCard, {
      props: { mode: 'link', href: '/example', disabled: true },
    });

    expect(wrapper.attributes('aria-disabled')).toBe('true');
    expect(wrapper.attributes('tabindex')).toBe('-1');

    await wrapper.trigger('click');
    expect(wrapper.emitted('action')).toBeUndefined();
  });

  it('renders the state layer only for actionable modes', () => {
    const staticCard = mount(MDCard, { props: { mode: 'static' } });
    const buttonCard = mount(MDCard, { props: { mode: 'button' } });
    const linkCard = mount(MDCard, { props: { mode: 'link', href: '/example' } });

    expect(staticCard.findComponent({ name: 'MDStateLayer' }).exists()).toBe(false);
    expect(buttonCard.findComponent({ name: 'MDStateLayer' }).exists()).toBe(true);
    expect(linkCard.findComponent({ name: 'MDStateLayer' }).exists()).toBe(true);
  });
});
