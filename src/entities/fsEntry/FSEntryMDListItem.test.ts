import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import FSEntryMDListItem from './FSEntryMDListItem.vue';

const TrailingButton = defineComponent({
  name: 'TrailingButton',
  setup() {
    return () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Action');
  },
});

const mountEntry = (
  props: { name: string; type: FSNodeType; isButton?: boolean; supportingText?: string },
  slots: { trailingAction?: () => unknown } = {},
) =>
  mount(FSEntryMDListItem, {
    attachTo: document.body,
    props,
    slots,
  });

describe('FSEntryMDListItem', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a non-interactive row for a non-openable file with no trailing action', () => {
    const wrapper = mountEntry({ name: 'readme.txt', type: FSNodeType.File, isButton: false });

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('renders a clickable row for an openable entry with no trailing action', async () => {
    const wrapper = mountEntry({ name: 'MyDir', type: FSNodeType.Directory, isButton: true });

    await wrapper.find('button').trigger('click');

    expect(wrapper.emitted('click')).toEqual([['MyDir']]);
  });

  it('does not render a primary action button for a non-openable file that has a trailing action', () => {
    const wrapper = mountEntry(
      { name: 'note.txt', type: FSNodeType.File, isButton: false },
      { trailingAction: () => h(TrailingButton) },
    );

    const primaryAction = wrapper.find('.md-list-item__primary-action');
    expect(primaryAction.exists()).toBe(false);

    expect(wrapper.find('[data-testid="trailing-btn"]').exists()).toBe(true);
  });

  it('renders multi-action layout for an openable entry that also has a trailing action', async () => {
    const wrapper = mountEntry(
      { name: 'db.json', type: FSNodeType.File, isButton: true },
      { trailingAction: () => h(TrailingButton) },
    );

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(true);
    expect(wrapper.find('[data-testid="trailing-btn"]').exists()).toBe(true);

    const nestedButtons = wrapper.find('.md-list-item__primary-action button');
    expect(nestedButtons.exists()).toBe(false);

    await wrapper.find('.md-list-item__primary-action').trigger('click');
    expect(wrapper.emitted('click')).toEqual([['db.json']]);
  });

  it('does not nest the trailing action inside the primary action', () => {
    const wrapper = mountEntry(
      { name: 'docs', type: FSNodeType.Directory, isButton: true },
      { trailingAction: () => h(TrailingButton) },
    );

    const primaryArea = wrapper.find('.md-list-item__primary-action');
    expect(primaryArea.find('[data-testid="trailing-btn"]').exists()).toBe(false);

    expect(wrapper.find('[data-testid="trailing-btn"]').exists()).toBe(true);
  });
});
