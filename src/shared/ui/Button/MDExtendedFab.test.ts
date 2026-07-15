import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDExtendedFab from './MDExtendedFab.vue';

const globalStubs = {
  MDCircularProgressIndicator: {
    props: ['progress'],
    template: '<span data-testid="progress" :data-progress="progress" />',
  },
  MDPlainTooltip: { template: '<span />' },
  MDSymbol: { template: '<span data-testid="symbol" />' },
};

describe('MDExtendedFab', () => {
  it('keeps native button content free of nested interactive descendants and divs', () => {
    const wrapper = mount(MDExtendedFab, {
      props: {
        tooltip: 'Add document',
        label: 'Add',
        mdSymbol: 'add',
      },
      global: {
        stubs: globalStubs,
      },
    });

    const button = wrapper.get('button');

    expect(button.find('button').exists()).toBe(false);
    expect(button.find('div').exists()).toBe(false);
    expect(button.find('input, select, textarea, a[href], [role="button"]').exists()).toBe(false);
  });

  it('uses the visible label as the accessible name when tooltip is omitted', () => {
    const wrapper = mount(MDExtendedFab, {
      props: {
        label: 'Create',
        mdSymbol: 'add',
      },
      global: {
        stubs: globalStubs,
      },
    });

    expect(wrapper.get('button').attributes('aria-label')).toBe('Create');
  });

  it('does not render an empty icon container when only a label is provided', () => {
    const wrapper = mount(MDExtendedFab, {
      props: {
        label: 'Create',
      },
      global: {
        stubs: globalStubs,
      },
    });

    expect(wrapper.find('.md-extended-fab__icon').exists()).toBe(false);
  });

  it('renders the icon container for loading state, mdSymbol, and icon slot content', () => {
    const loadingWrapper = mount(MDExtendedFab, {
      props: {
        label: 'Create',
        loading: true,
      },
      global: {
        stubs: globalStubs,
      },
    });

    expect(loadingWrapper.find('.md-extended-fab__icon').exists()).toBe(true);
    expect(loadingWrapper.find('[data-testid="progress"]').exists()).toBe(true);

    const zeroProgressWrapper = mount(MDExtendedFab, {
      props: {
        label: 'Create',
        loading: 0,
      },
      global: {
        stubs: globalStubs,
      },
    });

    expect(zeroProgressWrapper.find('.md-extended-fab__icon').exists()).toBe(true);
    expect(zeroProgressWrapper.find('[data-testid="progress"]').attributes('data-progress')).toBe(
      '0',
    );

    const symbolWrapper = mount(MDExtendedFab, {
      props: {
        label: 'Create',
        mdSymbol: 'add',
      },
      global: {
        stubs: globalStubs,
      },
    });

    expect(symbolWrapper.find('.md-extended-fab__icon').exists()).toBe(true);
    expect(symbolWrapper.find('[data-testid="symbol"]').exists()).toBe(true);

    const slotWrapper = mount(MDExtendedFab, {
      props: {
        label: 'Create',
      },
      slots: {
        icon: '<span data-testid="slot-icon">slot icon</span>',
      },
      global: {
        stubs: globalStubs,
      },
    });

    expect(slotWrapper.find('.md-extended-fab__icon').exists()).toBe(true);
    expect(slotWrapper.find('[data-testid="slot-icon"]').exists()).toBe(true);
  });

  it('does not render an icon container for loading=false or absent loading with no icon', () => {
    const falseLoadingWrapper = mount(MDExtendedFab, {
      props: { label: 'Create', loading: false },
      global: { stubs: globalStubs },
    });
    const absentLoadingWrapper = mount(MDExtendedFab, {
      props: { label: 'Create' },
      global: { stubs: globalStubs },
    });

    expect(falseLoadingWrapper.find('.md-extended-fab__icon').exists()).toBe(false);
    expect(absentLoadingWrapper.find('.md-extended-fab__icon').exists()).toBe(false);
  });

  it('renders determinate progress for a positive numeric loading value', () => {
    const wrapper = mount(MDExtendedFab, {
      props: { label: 'Create', loading: 0.5 },
      global: { stubs: globalStubs },
    });

    expect(wrapper.get('[data-testid="progress"]').attributes('data-progress')).toBe('0.5');
  });

  it('defaults to the "primary-container" color', () => {
    const wrapper = mount(MDExtendedFab, {
      props: { label: 'Create' },
      global: { stubs: globalStubs },
    });

    expect(wrapper.classes()).toContain('md-extended-fab_color_primary-container');
  });

  it('uses BEM modifiers and emits click events', async () => {
    const wrapper = mount(MDExtendedFab, {
      props: {
        label: 'Create',
        mdSymbol: 'add',
        size: 'medium',
        color: 'primary',
      },
      global: {
        stubs: globalStubs,
      },
    });

    expect(wrapper.classes()).toContain('md-extended-fab');
    expect(wrapper.classes()).toContain('md-extended-fab_size_medium');
    expect(wrapper.classes()).toContain('md-extended-fab_color_primary');

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('activates via click while loading, exactly once, keeping the accessible name and enabled state', async () => {
    const wrapper = mount(MDExtendedFab, {
      props: { label: 'Create', mdSymbol: 'add', loading: true },
      global: { stubs: globalStubs },
    });
    const button = wrapper.get('button');

    expect(button.attributes('aria-label')).toBe('Create');
    expect(button.attributes('disabled')).toBeUndefined();

    await button.trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(button.attributes('aria-label')).toBe('Create');
    expect(button.attributes('disabled')).toBeUndefined();
  });
});
