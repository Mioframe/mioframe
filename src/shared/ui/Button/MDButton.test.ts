import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDButton from './MDButton.vue';

const mountButton = () =>
  mount(MDButton, {
    props: {
      label: 'Save',
    },
    global: {
      stubs: {
        MDCircularProgressIndicator: {
          template: '<span class="md-circular-progress-indicator-stub" />',
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
});
