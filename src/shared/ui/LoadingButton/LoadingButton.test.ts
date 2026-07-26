import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import LoadingButton from './LoadingButton.vue';

describe('LoadingButton', () => {
  it('composes progress around an actionable Material Button without changing its label', async () => {
    const wrapper = mount(LoadingButton, {
      props: { label: 'Save', loading: 0 },
      global: {
        stubs: {
          MDButton: {
            props: ['label', 'disabled', 'nativeType', 'color', 'shape', 'size'],
            emits: ['click'],
            template:
              '<button class="md-button-stub" :disabled="disabled" :type="nativeType" @click="$emit(\'click\', $event)">{{ label }}<slot name="icon" /></button>',
          },
          MDCircularProgressIndicator: {
            props: ['progress'],
            template: '<span class="progress-stub" :data-progress="progress" />',
          },
        },
      },
    });

    expect(wrapper.get('.loading-button').attributes('aria-busy')).toBe('true');
    expect(wrapper.get('.md-button-stub').text()).toContain('Save');
    expect(wrapper.get('.progress-stub').attributes('data-progress')).toBe('0');

    await wrapper.get('.md-button-stub').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);
  });
});
