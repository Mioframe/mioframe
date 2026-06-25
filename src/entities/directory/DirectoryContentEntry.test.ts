import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import DirectoryContentEntry from './DirectoryContentEntry.vue';

const TrailingButton = defineComponent({
  name: 'TrailingButton',
  setup() {
    return () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Action');
  },
});

describe('DirectoryContentEntry', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a non-interactive row with no primary action button', () => {
    const wrapper = mount(DirectoryContentEntry, {
      attachTo: document.body,
      props: { name: 'readme.txt', type: FSNodeType.File },
    });

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('renders a trailing action without inferring a primary action from it', () => {
    const wrapper = mount(DirectoryContentEntry, {
      attachTo: document.body,
      props: { name: 'docs', type: FSNodeType.Directory },
      slots: { trailingAction: () => h(TrailingButton) },
    });

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(false);
    expect(wrapper.find('[data-testid="trailing-btn"]').exists()).toBe(true);
  });
});
