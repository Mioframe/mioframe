/* eslint-disable vue/one-component-per-file, @typescript-eslint/consistent-type-assertions -- Focused child stubs and branded fixture identities stay local to this contract test. */
import { mount } from '@vue/test-utils';
import type { AMDocumentId } from '@shared/lib/automerge';
import type { DatabaseItemId, DatabasePropertyId } from '@shared/lib/databaseDocument';
import { ref, defineComponent, h, type Ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EditableInlineValue from './EditableInlineValue.vue';

const controls = vi.hoisted(() => ({
  property: { name: 'Title', type: 'string' },
  value: undefined as string | number | boolean | undefined,
  postValue: vi.fn(),
  toggleBoolean: vi.fn(),
}));

/* Keep mutable test controls outside the hoisted mock factory; each mount receives a fresh ref. */
const propertyFixture = {
  name: 'Title',
  type: 'string',
  default: undefined as boolean | undefined,
  indeterminate: undefined as boolean | undefined,
};
const valueFixture = { current: 'initial' as unknown };

/* vi.mock factories run before normal imports, so the primitive fixtures are copied into refs there. */
vi.mock('@entity/databaseProperty', () => ({
  useDatabaseProperty: () => ({
    property: ref({
      name: propertyFixture.name,
      type: propertyFixture.type,
      default: propertyFixture.default,
      indeterminate: propertyFixture.indeterminate,
    }),
  }),
}));

vi.mock('@entity/databaseValue', () => ({
  useDatabaseEffectiveValue: () => ({ value: ref(valueFixture.current) }),
  useDatabaseStoredValue: () => ({ post: controls.postValue }),
}));

vi.mock('@shared/ui/State', () => ({
  MDStateLayer: defineComponent({ render: () => h('div', { class: 'md-state-layer' }) }),
  useRipple: vi.fn((target: Readonly<Ref<HTMLElement | null>>) => target),
  useStateLayer: vi.fn((target: Readonly<Ref<HTMLElement | null>>) => ({
    hover: ref(false),
    focused: ref(false),
    durationPressedState: ref(false),
    target,
  })),
}));

vi.mock('@shared/ui/Tooltips', () => ({
  MDOverlayTooltip: defineComponent({
    name: 'MDOverlayTooltip',
    props: { show: { type: Boolean, required: true } },
    emits: ['update:show', 'interaction-outside'],
    setup(props, { emit, slots }) {
      return () =>
        props.show
          ? h('div', { 'data-testid': 'tooltip' }, [
              h('button', {
                'data-testid': 'tooltip-close',
                onClick: () => {
                  emit('update:show', false);
                },
              }),
              h('button', {
                'data-testid': 'tooltip-outside',
                onClick: () => {
                  emit('interaction-outside');
                },
              }),
              slots.default?.(),
            ])
          : undefined;
    },
  }),
}));

vi.mock('@shared/ui/Checkbox', () => ({ toggleBoolean: controls.toggleBoolean }));
vi.mock('@shared/lib/validateZodScheme', () => ({
  zodIs: (value: { type?: string }, schema: { type: string }) => value.type === schema.type,
}));
vi.mock('@entity/databaseString', () => ({ zodStringProperty: { type: 'string' } }));
vi.mock('@entity/databaseBoolean', () => ({ zodBooleanProperty: { type: 'boolean' } }));
vi.mock('./DatabasePropertyValueFieldById.vue', () => ({
  default: defineComponent({ name: 'DatabasePropertyValueFieldById' }),
}));
vi.mock('./ValueInline.vue', () => ({
  default: defineComponent({ name: 'ValueInline' }),
}));

const ValueFieldStub = defineComponent({
  name: 'DatabasePropertyValueFieldById',
  props: {
    value: { required: true, type: [String, Number, Object] },
    inputSize: { required: true, type: Number },
  },
  emits: ['update:value', 'update:property', 'keydown'],
  setup(props, { emit }) {
    return () =>
      h('div', [
        h('input', {
          value: props.value,
          onInput: (event: Event) => {
            emit('update:value', (event.target as HTMLInputElement).value);
          },
          onKeydown: (event: KeyboardEvent) => {
            emit('keydown', event);
          },
        }),
        h('button', {
          'data-testid': 'field-update',
          onClick: () => {
            emit('update:value', 'next draft');
          },
        }),
        h('button', {
          'data-testid': 'field-property',
          onClick: () => {
            emit('update:property', { name: 'Next' });
          },
        }),
      ]);
  },
});

describe('EditableInlineValue', () => {
  const itemId = 'itemId-test' as DatabaseItemId;
  const propertyId = 'propertyId-test' as DatabasePropertyId;
  const documentId = 'document-test' as AMDocumentId;

  beforeEach(() => {
    propertyFixture.name = 'Title';
    propertyFixture.type = 'string';
    propertyFixture.default = undefined;
    propertyFixture.indeterminate = undefined;
    valueFixture.current = 'initial';
    controls.postValue.mockReset();
    controls.toggleBoolean.mockReset();
    controls.toggleBoolean.mockReturnValue(false);
  });

  const mountEditor = (
    editSession: { draft: unknown; resolving: boolean } | null = {
      draft: 'recoverable draft',
      resolving: false,
    },
  ) =>
    mount(EditableInlineValue, {
      props: {
        itemId,
        propertyId,
        directoryPath: '/database',
        documentId,
        ...(editSession === null ? {} : { editSession }),
      },
      global: {
        stubs: { DatabasePropertyValueFieldById: ValueFieldStub, ValueInline: true },
      },
    });

  it('detaches Material interaction feedback while resolving and restores the exact draft on recovery', async () => {
    const wrapper = mountEditor();
    const inlineRoot = wrapper.find('.editable-inline-value').element;
    const stateModule = await import('@shared/ui/State');
    const stateLayerTarget = vi.mocked(stateModule.useStateLayer).mock.results.at(-1)?.value
      .target as Ref<HTMLElement | null>;
    const rippleTarget = vi
      .mocked(stateModule.useRipple)
      .mock.calls.at(-1)?.[0] as Ref<HTMLElement | null>;

    expect(stateLayerTarget.value).toBe(inlineRoot);
    expect(rippleTarget.value).toBe(inlineRoot);
    expect(wrapper.find('.editable-inline-value_interactive').exists()).toBe(true);
    expect(wrapper.find('.md-state-layer').exists()).toBe(true);
    expect(wrapper.find('input').exists()).toBe(true);
    await wrapper.find('input').setValue('changed draft');
    expect(wrapper.emitted('update:draft')).toEqual([['changed draft']]);

    await wrapper.setProps({ editSession: { draft: 'recoverable draft', resolving: true } });
    expect(stateLayerTarget.value).toBeNull();
    expect(rippleTarget.value).toBeNull();
    expect(wrapper.find('.editable-inline-value_interactive').exists()).toBe(false);
    expect(wrapper.find('.md-state-layer').exists()).toBe(false);
    expect(wrapper.find('input').exists()).toBe(false);
    expect(wrapper.attributes('tabindex')).toBeUndefined();
    await wrapper.trigger('click');
    await wrapper.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('cancelEdit')).toBeUndefined();
    expect(wrapper.emitted('requestEdit')).toBeUndefined();
    expect(wrapper.emitted('update:draft')).toEqual([['changed draft']]);

    await wrapper.setProps({ editSession: { draft: 'recoverable draft', resolving: false } });
    expect(stateLayerTarget.value).toBe(inlineRoot);
    expect(rippleTarget.value).toBe(inlineRoot);
    expect(wrapper.find('.editable-inline-value_interactive').exists()).toBe(true);
    expect(wrapper.find('.md-state-layer').exists()).toBe(true);
    expect(wrapper.find('input').element).toHaveProperty('value', 'recoverable draft');
    await wrapper.find('input').setValue('recovered draft');
    expect(wrapper.emitted('update:draft')).toEqual([['changed draft'], ['recovered draft']]);
  });

  it('supports idle keyboard and pointer editing only for the supported keys', async () => {
    const wrapper = mountEditor(null);
    const root = wrapper.find('.editable-inline-value');
    expect(root.attributes()).toMatchObject({
      tabindex: '0',
      role: 'button',
      'aria-haspopup': 'dialog',
    });

    await root.trigger('click');
    await root.trigger('keydown', { key: 'Enter' });
    await root.trigger('keydown', { key: ' ' });
    await root.trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('requestEdit')).toEqual([['initial'], ['initial'], ['initial']]);
  });

  it('forwards active editor updates and commit/cancel intents, but not idle intents', async () => {
    const idle = mountEditor(null);
    await idle.trigger('keydown', { key: 'Escape' });
    expect(idle.emitted('commitEdit')).toBeUndefined();
    expect(idle.emitted('cancelEdit')).toBeUndefined();

    const wrapper = mountEditor();
    await wrapper.find('[data-testid="field-update"]').trigger('click');
    expect(wrapper.emitted('update:draft')).toEqual([['next draft']]);
    await wrapper.find('[data-testid="field-property"]').trigger('click');
    expect(wrapper.emitted('update:property')).toEqual([[{ name: 'Next' }]]);
    await wrapper.find('input').trigger('keydown', { key: 'Enter' });
    expect(wrapper.emitted('commitEdit')).toHaveLength(1);
    await wrapper.find('input').trigger('keydown', { key: 'Escape' });
    expect(wrapper.emitted('cancelEdit')).toHaveLength(1);
  });

  it('does not resolve an active editor on unmount', async () => {
    const unmounted = mountEditor();
    unmounted.unmount();
    expect(unmounted.emitted('commitEdit')).toBeUndefined();
    expect(unmounted.emitted('cancelEdit')).toBeUndefined();

    const closed = mountEditor();
    await closed.find('[data-testid="tooltip-close"]').trigger('click');
    expect(closed.emitted('cancelEdit')).toEqual([[]]);
    closed.unmount();
    expect(closed.emitted('commitEdit')).toBeUndefined();
  });

  it('uses the stored-value boolean path with checkbox semantics', async () => {
    propertyFixture.name = 'Done';
    propertyFixture.type = 'boolean';
    propertyFixture.indeterminate = true;
    valueFixture.current = false;
    const wrapper = mountEditor(null);
    const root = wrapper.find('.editable-inline-value');
    expect(root.attributes()).toMatchObject({ role: 'checkbox', 'aria-checked': 'false' });
    expect(root.attributes('aria-haspopup')).toBeUndefined();
    await root.trigger('click');
    await root.trigger('keydown', { key: 'Enter' });
    await root.trigger('keydown', { key: ' ' });
    expect(controls.toggleBoolean).toHaveBeenCalledWith(false, true);
    expect(controls.postValue).toHaveBeenCalledTimes(3);
    expect(controls.postValue).toHaveBeenNthCalledWith(1, false);
    expect(controls.postValue).toHaveBeenNthCalledWith(2, false);
    expect(controls.postValue).toHaveBeenNthCalledWith(3, false);
    expect(wrapper.emitted('requestEdit')).toBeUndefined();

    wrapper.unmount();
    valueFixture.current = undefined;
    const mixed = mountEditor(null);
    expect(mixed.find('.editable-inline-value').attributes('aria-checked')).toBe('mixed');
    mixed.unmount();
    propertyFixture.default = true;
    propertyFixture.indeterminate = false;
    const defaulted = mountEditor(null);
    expect(defaulted.find('.editable-inline-value').attributes('aria-checked')).toBe('true');
    defaulted.unmount();
    valueFixture.current = true;
    const storedTrue = mountEditor(null);
    expect(storedTrue.find('.editable-inline-value').attributes('aria-checked')).toBe('true');
  });

  it('sizes string editors from the lifted draft and leaves non-string values unsized', () => {
    const shortString = mountEditor({ draft: 'a', resolving: false });
    expect(shortString.findComponent(ValueFieldStub).props('inputSize')).toBe(12);
    shortString.unmount();
    const wrapper = mountEditor({ draft: 'a'.repeat(20), resolving: false });
    expect(wrapper.findComponent(ValueFieldStub).props('inputSize')).toBe(20);
    wrapper.unmount();
    propertyFixture.name = 'Count';
    propertyFixture.type = 'number';
    const numberEditor = mountEditor({ draft: 42, resolving: false });
    expect(numberEditor.findComponent(ValueFieldStub).props('inputSize')).toBe(0);
  });
});

/* eslint-enable vue/one-component-per-file, @typescript-eslint/consistent-type-assertions -- Restore file defaults after local fixture assertions. */
