import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDListItem from './MDListItem.vue';

const mountListItemButton = () =>
  mount(MDListItem, {
    props: {
      is: 'button',
      type: 'button',
      headline: 'Settings',
    },
  });

describe('MDListItem', () => {
  it('keeps button hosts free of nested interactive descendants and divs', () => {
    const wrapper = mountListItemButton();
    const button = wrapper.get('button');

    expect(button.find('button').exists()).toBe(false);
    expect(button.find('div').exists()).toBe(false);
    expect(button.find('input, select, textarea, a[href], [role="button"]').exists()).toBe(false);
  });
});
