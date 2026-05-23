/* eslint-disable vue/one-component-per-file -- Inline stubs keep this contract test focused. */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h } from 'vue';

vi.mock('../Button', () => ({
  MDButton: defineComponent({
    name: 'MDButtonStub',
    props: {
      label: {
        type: String,
        required: true,
      },
    },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            onClick: () => {
              emit('click');
            },
          },
          props.label,
        );
    },
  }),
  MDIconButton: defineComponent({
    name: 'MDIconButtonStub',
    props: {
      tooltip: {
        type: String,
        required: true,
      },
    },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            'aria-label': props.tooltip,
            onClick: () => {
              emit('click');
            },
          },
          props.tooltip,
        );
    },
  }),
}));

vi.mock('../Icon', () => ({
  MDSymbol: defineComponent({
    name: 'MDSymbolStub',
    setup() {
      return () => h('span', '>');
    },
  }),
}));

const mountNavigationPath = async (props: { path: string; omitCurrent?: boolean }) => {
  const { default: MDNavigationPath } = await import('./MDNavigationPath.vue');

  return mount(MDNavigationPath, {
    props,
  });
};

describe('MDNavigationPath', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('omits the current folder from the breadcrumb by default', async () => {
    const wrapper = await mountNavigationPath({
      path: '/Google Drive/My Drive/Projects/Mioframe',
    });

    expect(wrapper.text()).toContain('Google Drive');
    expect(wrapper.text()).toContain('My Drive');
    expect(wrapper.text()).toContain('Projects');
    expect(wrapper.text()).not.toContain('Главная');
    expect(wrapper.text()).not.toContain('Mioframe');
  });

  it('emits clickHome from the home icon', async () => {
    const wrapper = await mountNavigationPath({
      path: '/Google Drive/My Drive/Projects',
    });

    await wrapper.get('button[aria-label="Home"]').trigger('click');

    expect(wrapper.emitted('clickHome')).toEqual([[]]);
  });

  it('emits the selected parent path when a breadcrumb segment is clicked', async () => {
    const wrapper = await mountNavigationPath({
      path: '/Google Drive/My Drive/Projects/Mioframe',
    });

    const myDriveButton = wrapper.findAll('button').find((button) => button.text() === 'My Drive');

    if (!myDriveButton) {
      throw new Error('Expected My Drive breadcrumb button');
    }

    await myDriveButton.trigger('click');

    expect(wrapper.emitted('click')).toEqual([['/Google Drive/My Drive']]);
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after inline stubs. */
