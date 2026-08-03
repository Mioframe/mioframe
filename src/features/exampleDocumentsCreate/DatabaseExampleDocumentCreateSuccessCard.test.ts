import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';
import DatabaseExampleDocumentCreateSuccessCard from './DatabaseExampleDocumentCreateSuccessCard.vue';

vi.mock('@shared/ui/material', () => ({
  MDButton: defineComponent({
    props: { label: { type: String, required: true } },
    emits: ['click'],
    setup(_, { emit }) {
      const onClick = (event: MouseEvent) => {
        emit('click', event);
      };
      return { onClick };
    },
    template: '<button type="button" @click="onClick">{{ label }}</button>',
  }),
}));

describe('DatabaseExampleDocumentCreateSuccessCard', () => {
  it('renders the headline and supporting text', () => {
    const wrapper = mount(DatabaseExampleDocumentCreateSuccessCard);

    expect(wrapper.find('.database-example-document-create-success-card__headline').text()).toBe(
      'Example created',
    );
    expect(
      wrapper.find('.database-example-document-create-success-card__supporting-text').text(),
    ).toContain('regular Mioframe document');
  });

  it('renders a "Got it" button', () => {
    const wrapper = mount(DatabaseExampleDocumentCreateSuccessCard);

    const button = wrapper.find('button');
    expect(button.exists()).toBe(true);
    expect(button.text()).toContain('Got it');
  });

  it('emits dismiss when the Got it button is clicked', async () => {
    const wrapper = mount(DatabaseExampleDocumentCreateSuccessCard);

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('dismiss')).toHaveLength(1);
  });
});
