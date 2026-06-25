import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDMenuItemBase from './MDMenuItemBase.vue';

describe('MDMenuItemBase', () => {
  it('renders the label and emits click on press', async () => {
    const wrapper = mount(MDMenuItemBase, {
      props: { label: 'Rename' },
    });

    expect(wrapper.text()).toContain('Rename');
    expect(wrapper.find('.md-menu-item-base__leading').exists()).toBe(false);
    expect(wrapper.find('.md-menu-item-base__trailing').exists()).toBe(false);

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('renders a leading icon only when symbolName is provided', () => {
    const wrapper = mount(MDMenuItemBase, {
      props: { label: 'Star', symbolName: 'star' },
      global: { stubs: { MDSymbol: { template: '<span class="md-symbol-stub" />' } } },
    });

    expect(wrapper.find('.md-menu-item-base__leading .md-symbol-stub').exists()).toBe(true);
  });

  it('renders the submenu trailing icon and keeps the submenu surface outside the native button when a submenu slot is provided', () => {
    const wrapper = mount(MDMenuItemBase, {
      props: { label: 'Has submenu' },
      slots: { submenu: '<div class="submenu-item-stub">Nested</div>' },
      global: {
        stubs: {
          MDSymbol: { template: '<span class="md-symbol-stub" />' },
          MDMenuBase: { template: '<div class="md-menu-base-stub"><slot /></div>' },
        },
      },
    });

    expect(wrapper.find('.md-menu-item-base__trailing .md-symbol-stub').exists()).toBe(true);

    const button = wrapper.get('button');
    expect(button.find('button, .submenu-item-stub').exists()).toBe(false);
    expect(wrapper.find('.md-menu-base-stub .submenu-item-stub').exists()).toBe(true);
  });

  it('does not render a submenu surface when no submenu slot is provided', () => {
    const wrapper = mount(MDMenuItemBase, {
      props: { label: 'Plain' },
    });

    expect(wrapper.find('.md-menu-base-stub').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'MDMenuBase' }).exists()).toBe(false);
  });
});
