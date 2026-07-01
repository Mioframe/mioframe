import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
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
    expect(wrapper.attributes('href')).toBeUndefined();

    await wrapper.trigger('click');
    expect(wrapper.emitted('action')).toBeUndefined();
  });

  it('restores href once a disabled link becomes enabled', async () => {
    const wrapper = mount(MDCard, {
      props: { mode: 'link', href: '/example', disabled: true },
    });

    expect(wrapper.attributes('href')).toBeUndefined();

    await wrapper.setProps({ disabled: false });
    expect(wrapper.attributes('href')).toBe('/example');
  });

  it('renders the state layer only for actionable modes', () => {
    const staticCard = mount(MDCard, { props: { mode: 'static' } });
    const buttonCard = mount(MDCard, { props: { mode: 'button' } });
    const linkCard = mount(MDCard, { props: { mode: 'link', href: '/example' } });

    expect(staticCard.findComponent({ name: 'MDStateLayer' }).exists()).toBe(false);
    expect(buttonCard.findComponent({ name: 'MDStateLayer' }).exists()).toBe(true);
    expect(linkCard.findComponent({ name: 'MDStateLayer' }).exists()).toBe(true);
  });

  it('warns in development when a button-mode card renders block-level content', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount(MDCard, {
      props: { mode: 'button' },
      slots: { default: '<h3>Rich heading</h3>' },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('mode="button" only supports simple/phrasing slot content'),
    );

    warnSpy.mockRestore();
  });

  it('does not warn in development when a button-mode card renders phrasing-only content', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount(MDCard, {
      props: { mode: 'button' },
      slots: { default: 'Tap this whole card' },
    });

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('mode="button" only supports simple/phrasing slot content'),
    );

    warnSpy.mockRestore();
  });

  it('does not warn about rich content for static or link cards', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    mount(MDCard, { props: { mode: 'static' }, slots: { default: '<h3>Heading</h3>' } });
    mount(MDCard, {
      props: { mode: 'link', href: '/example' },
      slots: { default: '<h3>Heading</h3>' },
    });

    expect(warnSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('mode="button" only supports simple/phrasing slot content'),
    );

    warnSpy.mockRestore();
  });
});
