import { Repo } from '@automerge/automerge-repo';
import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, ref } from 'vue';
import { MDList } from '@shared/ui/Lists';
import DocumentMDListItem from './DocumentMDListItem.vue';

vi.mock('./useDocument', () => ({
  useDocument: () => ({
    state: ref({ name: 'My Doc' }),
    isLoading: ref(false),
    errorMessage: ref(undefined),
  }),
}));

const TEST_DOC_ID = new Repo().create({}).documentId;

const mountItem = (
  props: Partial<{ is: 'button' | 'div' | 'li'; supportingText?: string }> = {},
  slots: Record<string, string> = {},
) =>
  mount(DocumentMDListItem, {
    attachTo: document.body,
    props: {
      path: '/docs',
      documentId: TEST_DOC_ID,
      ...props,
    },
    slots,
  });

const mountItemInList = (
  props: Partial<{ supportingText?: string }> = {},
  slots: Record<string, () => unknown> = {},
) =>
  mount(
    defineComponent({
      components: { DocumentMDListItem, MDList },
      setup() {
        return () =>
          h(MDList, null, {
            default: () =>
              h(
                DocumentMDListItem,
                {
                  path: '/docs',
                  documentId: TEST_DOC_ID,
                  is: 'button',
                  ...props,
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

describe('DocumentMDListItem', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('renders a static non-clickable row when is is not button and no trailing action', () => {
    const wrapper = mountItem({ is: 'div' });

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(false);
    expect(wrapper.find('button').exists()).toBe(false);
  });

  it('renders a static row even when trailingAction slot is provided and is is not button', () => {
    const wrapper = mountItem(
      { is: 'div' },
      { trailingAction: '<button type="button" data-testid="trailing-btn">Delete</button>' },
    );

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(false);

    expect(wrapper.find('[data-testid="trailing-btn"]').exists()).toBe(true);
  });

  it('renders a single-action clickable row when is is button without trailing action', () => {
    const wrapper = mountItemInList();

    expect(wrapper.find('button').exists()).toBe(true);
    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(true);
    expect(wrapper.find('.md-list-item__trailing-action').exists()).toBe(false);
  });

  it('renders a valid multi-action row when is is button and trailingAction slot is provided', () => {
    const wrapper = mountItemInList(
      {},
      {
        trailingAction: () =>
          h('button', { type: 'button', 'data-testid': 'trailing-btn' }, 'Delete'),
      },
    );

    expect(wrapper.find('.md-list-item__primary-action').exists()).toBe(true);
    expect(wrapper.find('[data-testid="trailing-btn"]').exists()).toBe(true);

    const nestedTrailingInPrimary = wrapper
      .find('.md-list-item__primary-action')
      .find('[data-testid="trailing-btn"]');
    expect(nestedTrailingInPrimary.exists()).toBe(false);
  });

  it('emits click with documentId when a clickable row is activated', async () => {
    const wrapper = mountItemInList();

    await wrapper.find('.md-list-item__primary-action').trigger('click');

    const item = wrapper.getComponent(DocumentMDListItem);
    expect(item.emitted('click')).toEqual([[TEST_DOC_ID]]);
  });
});
