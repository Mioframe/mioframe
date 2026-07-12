import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import QueryObject from './QueryObject.vue';
import QueryGroup from './QueryGroup.vue';
import { OPERATOR } from './constants';

describe('QueryObject', () => {
  it('keeps the objectAppend slot element identity when the query grows from empty to one entry', async () => {
    const wrapper = mount(QueryObject, {
      props: { query: {} },
      slots: {
        objectAppend: '<button class="append-marker">add</button>',
      },
    });

    const elementBeforeGrow = wrapper.get('.append-marker').element;

    await wrapper.setProps({ query: { title: 'value' } });

    expect(wrapper.get('.append-marker').element).toBe(elementBeforeGrow);
  });
});

describe('QueryGroup', () => {
  it('keeps the groupAppend slot element identity when the array grows from empty to one entry', async () => {
    const wrapper = mount(QueryGroup, {
      props: { operator: OPERATOR.$and, parentOperator: OPERATOR.$eq, array: [] },
      slots: {
        groupAppend: '<button class="append-marker">add</button>',
      },
    });

    const elementBeforeGrow = wrapper.get('.append-marker').element;

    await wrapper.setProps({ array: ['value'] });

    expect(wrapper.get('.append-marker').element).toBe(elementBeforeGrow);
  });
});
