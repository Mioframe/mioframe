import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDExtendedFab from './MDExtendedFab.vue';

const globalStubs = {
  MDCircularProgressIndicator: { template: '<span data-testid="progress" />' },
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
});
