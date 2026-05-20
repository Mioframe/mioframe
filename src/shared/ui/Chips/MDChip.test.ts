import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDChip from './MDChip.vue';

const mountChip = () =>
  mount(MDChip, {
    props: {
      label: 'Filter value',
      type: 'input',
    },
    global: {
      stubs: {
        MDIconButton: {
          emits: ['click'],
          template:
            '<button type="button" class="md-icon-button-stub" @click="$emit(\'click\', $event)">close</button>',
        },
        MDStateLayer: {
          template: '<span class="md-state-layer-stub" />',
        },
        MDSymbol: {
          template: '<span class="md-symbol-stub" />',
        },
      },
    },
  });

describe('MDChip', () => {
  it('renders input chips without nested buttons', () => {
    const wrapper = mountChip();

    expect(wrapper.findAll('button')).toHaveLength(2);
    expect(wrapper.find('.md-chip_input-shell > .md-chip__action').exists()).toBe(true);
    expect(wrapper.find('.md-chip__action .md-icon-button-stub').exists()).toBe(false);
  });

  it('emits close clicks without triggering the chip click event', async () => {
    const wrapper = mountChip();

    await wrapper.get('.md-chip__action').trigger('click');
    expect(wrapper.emitted('click')).toHaveLength(1);

    await wrapper.get('.md-icon-button-stub').trigger('click');

    expect(wrapper.emitted('click')).toHaveLength(1);
    expect(wrapper.emitted('clickClose')).toHaveLength(1);
  });
});
