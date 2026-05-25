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
          h('span', { 'aria-hidden': 'true' }, 'icon'),
        );
    },
  }),
}));

vi.mock('./MDNavigationPathSegmentButton.vue', () => ({
  default: defineComponent({
    name: 'MDNavigationPathSegmentButtonStub',
    props: {
      label: {
        type: String,
        required: true,
      },
      path: {
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
              emit('click', props.path);
            },
          },
          props.label,
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

const mountNavigationPath = async (props: { path: string; hideCurrent?: boolean }) => {
  const { default: MDNavigationPath } = await import('./MDNavigationPath.vue');

  return mount(MDNavigationPath, {
    props,
  });
};

describe('MDNavigationPath', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders the current folder in the breadcrumb by default', async () => {
    const wrapper = await mountNavigationPath({
      path: '/Google Drive/My Drive/Projects/Mioframe',
    });

    expect(wrapper.text()).toContain('Google Drive');
    expect(wrapper.text()).toContain('My Drive');
    expect(wrapper.text()).toContain('Projects');
    expect(wrapper.text()).toContain('Mioframe');
    expect(wrapper.text()).not.toContain('Home');
  });

  it('hides the current folder when hideCurrent is true', async () => {
    const wrapper = await mountNavigationPath({
      path: '/Documents/Project',
      hideCurrent: true,
    });

    const labels = wrapper.findAll('button').map((button) => button.text());

    expect(labels).toEqual(['icon', 'Documents']);
    expect(wrapper.text()).not.toContain('Project');
  });

  it('renders only the home icon for the root path', async () => {
    const wrapper = await mountNavigationPath({
      path: '/',
    });

    expect(wrapper.findAll('button')).toHaveLength(1);
    expect(wrapper.find('button[aria-label="Home"]').exists()).toBe(true);
    expect(wrapper.text()).not.toContain('>');
  });

  it('does not render an empty-label path button', async () => {
    const wrapper = await mountNavigationPath({
      path: '/Documents/Project',
      hideCurrent: false,
    });

    const pathButtons = wrapper.findAll('button').slice(1);

    expect(pathButtons.every((button) => button.text().trim().length > 0)).toBe(true);
  });

  it('renders the current segment when hideCurrent is false', async () => {
    const wrapper = await mountNavigationPath({
      path: '/Documents/Project',
      hideCurrent: false,
    });

    const labels = wrapper.findAll('button').map((button) => button.text());

    expect(labels).toEqual(['icon', 'Documents', 'Project']);
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
