/* eslint-disable vue/one-component-per-file -- Focused item contract test with inline stub component. */
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it } from 'vitest';
import { defineComponent, h } from 'vue';
import { FSNodeType } from '@shared/lib/virtualFileSystem';
import { MDList } from '@shared/ui/Lists';
import FSEntryMDListItem from './FSEntryMDListItem.vue';

const TrailingButton = defineComponent({
  name: 'TrailingButton',
  setup() {
    return () => h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Action');
  },
});

const mountEntry = (
  props: { name: string; type: FSNodeType; isOpenable?: boolean; supportingText?: string },
  slots: { trailingAction?: () => unknown } = {},
) =>
  mount(FSEntryMDListItem, {
    attachTo: document.body,
    props,
    slots,
  });

const mountEntryInList = (
  props: { name: string; type: FSNodeType; supportingText?: string },
  slots: { trailingAction?: () => unknown } = {},
) =>
  mount(
    defineComponent({
      components: { FSEntryMDListItem, MDList },
      setup() {
        return () =>
          h(MDList, null, {
            default: () =>
              h(
                FSEntryMDListItem,
                {
                  ...props,
                  isOpenable: true,
                  onClick: () => undefined,
                },
                slots,
              ),
          });
      },
    }),
    {
      attachTo: document.body,
    },
  );

describe('FSEntryMDListItem', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a non-interactive row for a non-openable file with no trailing action', () => {
    const wrapper = mountEntry({ name: 'readme.txt', type: FSNodeType.File, isOpenable: false });

    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('renders a clickable row for an openable entry with no trailing action', async () => {
    const wrapper = mountEntryInList({ name: 'MyDir', type: FSNodeType.Directory });

    await wrapper.find('.md-list-item__primary-action').trigger('click');

    const item = wrapper.getComponent(FSEntryMDListItem);
    expect(item.emitted('click')).toEqual([['MyDir']]);
  });

  it('does not render a primary action button for a non-openable file that has a trailing action', () => {
    const wrapper = mountEntry(
      { name: 'note.txt', type: FSNodeType.File, isOpenable: false },
      { trailingAction: () => h(TrailingButton) },
    );

    const primaryAction = wrapper.find('.md-list-item__primary-action');
    expect(primaryAction.exists()).toBe(false);

    expect(wrapper.find('[data-testid="trailing-btn"]').exists()).toBe(true);
  });

  it('renders multi-action layout for an openable entry that also has a trailing action', async () => {
    const wrapper = mountEntryInList(
      { name: 'db.json', type: FSNodeType.File },
      { trailingAction: () => h(TrailingButton) },
    );

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(true);
    expect(wrapper.find('[data-testid="trailing-btn"]').exists()).toBe(true);

    const nestedButtons = wrapper.find('.md-list-item__primary-action button');
    expect(nestedButtons.exists()).toBe(false);

    await wrapper.find('.md-list-item__primary-action').trigger('click');
    const item = wrapper.getComponent(FSEntryMDListItem);
    expect(item.emitted('click')).toEqual([['db.json']]);
  });

  it('does not nest the trailing action inside the primary action', () => {
    const wrapper = mountEntryInList(
      { name: 'docs', type: FSNodeType.Directory },
      { trailingAction: () => h(TrailingButton) },
    );

    const primaryArea = wrapper.find('.md-list-item__primary-action');
    expect(primaryArea.find('[data-testid="trailing-btn"]').exists()).toBe(false);

    expect(wrapper.find('[data-testid="trailing-btn"]').exists()).toBe(true);
  });
});
/* eslint-enable vue/one-component-per-file -- Re-enable after focused inline stub component. */
