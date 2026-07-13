import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import MDFab from './MDFab.vue';

const mountFab = () =>
  mount(MDFab, {
    props: {
      tooltip: 'Create item',
      mdSymbol: 'add',
    },
    global: {
      stubs: {
        MDCircularProgressIndicator: {
          template: '<span class="md-circular-progress-indicator-stub" />',
        },
        MDPlainTooltip: {
          template: '<span class="md-plain-tooltip-stub" />',
        },
        MDSymbol: {
          template: '<span class="md-symbol-stub" />',
        },
      },
    },
  });

describe('MDFab', () => {
  it('uses BEM modifiers and emits click events', async () => {
    const wrapper = mount(MDFab, {
      props: {
        tooltip: 'Create item',
        mdSymbol: 'add',
        size: 'large',
        color: 'primary-container',
      },
      global: {
        stubs: {
          MDCircularProgressIndicator: {
            template: '<span class="md-circular-progress-indicator-stub" />',
          },
          MDPlainTooltip: {
            template: '<span class="md-plain-tooltip-stub" />',
          },
          MDSymbol: {
            template: '<span class="md-symbol-stub" />',
          },
        },
      },
    });

    expect(wrapper.classes()).toContain('md-fab');
    expect(wrapper.classes()).toContain('md-fab_size_large');
    expect(wrapper.classes()).toContain('md-fab_color_primary-container');

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('defaults to the "regular" size and "primary-container" color, with no debug placeholder icon', () => {
    const wrapper = mountFab();

    expect(wrapper.classes()).toContain('md-fab_size_regular');
    expect(wrapper.classes()).toContain('md-fab_color_primary-container');
    expect(wrapper.find('.md-fab__empty-icon').exists()).toBe(false);
  });

  it('warns in development when no icon source is provided', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mount(MDFab, {
      props: {
        tooltip: 'Create item',
      },
      global: {
        stubs: {
          MDCircularProgressIndicator: {
            template: '<span class="md-circular-progress-indicator-stub" />',
          },
          MDPlainTooltip: {
            template: '<span class="md-plain-tooltip-stub" />',
          },
          MDSymbol: {
            template: '<span class="md-symbol-stub" />',
          },
        },
      },
    });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('provide an icon via `mdSymbol` or the `icon` slot'),
    );

    warnSpy.mockRestore();
  });

  it('does not warn when an icon source is provided', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    mountFab();

    expect(warnSpy).not.toHaveBeenCalled();

    warnSpy.mockRestore();
  });

  it('keeps native button content free of nested interactive descendants and divs', () => {
    const wrapper = mountFab();
    const button = wrapper.get('button');

    expect(button.find('button').exists()).toBe(false);
    expect(button.find('div').exists()).toBe(false);
    expect(button.find('input, select, textarea, a[href], [role="button"]').exists()).toBe(false);
  });

  it('treats loading=0 as an active loading state and forwards progress=0', () => {
    const wrapper = mount(MDFab, {
      props: {
        tooltip: 'Create item',
        mdSymbol: 'add',
        loading: 0,
      },
      global: {
        stubs: {
          MDCircularProgressIndicator: {
            props: ['progress'],
            template: '<span class="md-circular-progress-indicator-stub">{{ progress }}</span>',
          },
          MDPlainTooltip: {
            template: '<span class="md-plain-tooltip-stub" />',
          },
          MDSymbol: {
            template: '<span class="md-symbol-stub" />',
          },
        },
      },
    });

    expect(wrapper.find('.md-circular-progress-indicator-stub').exists()).toBe(true);
    expect(wrapper.find('.md-circular-progress-indicator-stub').text()).toBe('0');
    expect(wrapper.find('.md-symbol-stub').exists()).toBe(false);
  });

  it('does not render the progress indicator when loading is false or absent', () => {
    const stubs = {
      MDCircularProgressIndicator: {
        template: '<span class="md-circular-progress-indicator-stub" />',
      },
      MDPlainTooltip: { template: '<span class="md-plain-tooltip-stub" />' },
      MDSymbol: { template: '<span class="md-symbol-stub" />' },
    };

    const falseLoadingWrapper = mount(MDFab, {
      props: { tooltip: 'Create item', mdSymbol: 'add', loading: false },
      global: { stubs },
    });
    const absentLoadingWrapper = mountFab();

    expect(falseLoadingWrapper.find('.md-circular-progress-indicator-stub').exists()).toBe(false);
    expect(absentLoadingWrapper.find('.md-circular-progress-indicator-stub').exists()).toBe(false);
  });

  it('renders indeterminate progress when loading is true', () => {
    const wrapper = mount(MDFab, {
      props: { tooltip: 'Create item', mdSymbol: 'add', loading: true },
      global: {
        stubs: {
          MDCircularProgressIndicator: {
            props: ['progress'],
            template:
              '<span class="md-circular-progress-indicator-stub" :data-progress="progress" />',
          },
          MDPlainTooltip: { template: '<span class="md-plain-tooltip-stub" />' },
          MDSymbol: { template: '<span class="md-symbol-stub" />' },
        },
      },
    });

    const indicator = wrapper.get('.md-circular-progress-indicator-stub');
    expect(indicator.attributes('data-progress')).toBeUndefined();
    expect(wrapper.find('.md-symbol-stub').exists()).toBe(false);
  });

  it('renders determinate progress for a positive numeric loading value', () => {
    const wrapper = mount(MDFab, {
      props: { tooltip: 'Create item', mdSymbol: 'add', loading: 0.5 },
      global: {
        stubs: {
          MDCircularProgressIndicator: {
            props: ['progress'],
            template: '<span class="md-circular-progress-indicator-stub">{{ progress }}</span>',
          },
          MDPlainTooltip: { template: '<span class="md-plain-tooltip-stub" />' },
          MDSymbol: { template: '<span class="md-symbol-stub" />' },
        },
      },
    });

    expect(wrapper.find('.md-circular-progress-indicator-stub').text()).toBe('0.5');
  });
});
