import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDButton from './MDButton.vue';

const mountButton = (props: Record<string, unknown> = {}) =>
  mount(MDButton, {
    props: {
      label: 'Save',
      ...props,
    },
    global: {
      stubs: {
        MDCircularProgressIndicator: {
          props: ['progress'],
          template:
            '<span class="md-circular-progress-indicator-stub" :data-progress="progress" />',
        },
      },
    },
  });

describe('MDButton', () => {
  it('keeps native button content free of nested buttons and divs', () => {
    const wrapper = mountButton();
    const button = wrapper.get('button');

    expect(button.find('button').exists()).toBe(false);
    expect(button.find('div').exists()).toBe(false);
    expect(button.findAll('span').length).toBeGreaterThan(0);
  });

  it('treats loading=0 as an active loading state', () => {
    const wrapper = mountButton({
      loading: 0,
    });

    expect(wrapper.classes()).toContain('md-button_loading');
    expect(wrapper.find('.md-circular-progress-indicator-stub').exists()).toBe(true);
    expect(wrapper.get('.md-circular-progress-indicator-stub').attributes('data-progress')).toBe(
      '0',
    );
  });

  it('does not treat loading=false or absent loading as an active loading state', () => {
    const falseLoadingWrapper = mountButton({
      loading: false,
    });
    const absentLoadingWrapper = mountButton();

    expect(falseLoadingWrapper.classes()).not.toContain('md-button_loading');
    expect(falseLoadingWrapper.find('.md-circular-progress-indicator-stub').exists()).toBe(false);
    expect(absentLoadingWrapper.classes()).not.toContain('md-button_loading');
    expect(absentLoadingWrapper.find('.md-circular-progress-indicator-stub').exists()).toBe(false);
  });
});
