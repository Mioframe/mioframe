import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
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
        color: 'tonal-primary',
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
    expect(wrapper.classes()).toContain('md-fab_color_tonal-primary');

    await wrapper.get('button').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
  });

  it('renders the BEM empty icon element when no icon source is provided', () => {
    const wrapper = mount(MDFab, {
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

    expect(wrapper.find('.md-fab__empty-icon').exists()).toBe(true);
  });

  it('keeps native button content free of nested interactive descendants and divs', () => {
    const wrapper = mountFab();
    const button = wrapper.get('button');

    expect(button.find('button').exists()).toBe(false);
    expect(button.find('div').exists()).toBe(false);
    expect(button.find('input, select, textarea, a[href], [role="button"]').exists()).toBe(false);
  });
});
