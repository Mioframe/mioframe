/* eslint-disable vue/one-component-per-file -- test file keeps several local component stubs near their mocks for readability. */

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

const propertyRef = ref<{
  default?: unknown;
  indeterminate?: boolean;
  name: string;
  type: string;
}>({
  default: 'untitled',
  name: 'Title',
  type: 'string',
});
const valueRef = ref<unknown>('untitled');
const storedValueRef = ref<unknown>(undefined);
const postValueMock = vi.fn(() => Promise.resolve());

vi.mock('@entity/databaseProperty', () => ({
  useDatabaseProperty: () => ({
    property: propertyRef,
  }),
}));

vi.mock('@entity/databaseValue', () => ({
  useDatabaseEffectiveValue: () => ({
    value: valueRef,
  }),
  useDatabaseStoredValue: () => ({
    post: postValueMock,
    storedValue: storedValueRef,
  }),
}));

vi.mock('./ValueInline.vue', () => ({
  default: defineComponent({
    name: 'ValueInlineStub',

    props: {
      tabIndex: {
        required: false,
        type: Number,
      },
    },

    emits: {
      click: () => true,
    },

    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            class: 'value-inline-stub',
            tabindex: props.tabIndex,
            type: 'button',
            onClick: () => {
              emit('click');
            },
          },
          'value-inline',
        );
    },
  }),
}));

vi.mock('./ValueField.vue', () => ({
  default: defineComponent({
    name: 'ValueFieldStub',

    props: {
      inputSize: {
        required: false,
        type: Number,
      },
      value: {
        required: false,
        type: null,
      },
    },

    emits: {
      'update:value': (value: unknown) => {
        void value;
        return true;
      },
    },

    setup(props, { emit }) {
      return () =>
        h('input', {
          'data-input-size': props.inputSize,
          value: String(props.value ?? ''),
          onInput: (event: Event) => {
            const target = event.currentTarget;

            if (!(target instanceof HTMLInputElement)) {
              return;
            }

            emit('update:value', target.value);
          },
        });
    },
  }),
}));

vi.mock('@shared/ui/State', () => ({
  MDState: defineComponent({
    name: 'MDStateStub',
    inheritAttrs: false,

    setup(_props, { attrs, slots }) {
      return () => h('div', attrs, slots.default?.());
    },
  }),
}));

vi.mock('@shared/ui/Tooltips', () => ({
  MDOverlayTooltip: defineComponent({
    name: 'MDOverlayTooltipStub',
    inheritAttrs: false,

    props: {
      show: {
        default: false,
        type: Boolean,
      },
    },

    setup(props, { slots }) {
      return () =>
        props.show ? h('div', { class: 'overlay-tooltip-stub' }, slots.default?.()) : null;
    },
  }),
}));

import EditableInlineValue from './EditableInlineValue.vue';

const mountEditableInlineValue = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const app = createApp(EditableInlineValue, {
    directoryPath: '/db',
    documentId: 'doc-id',
    itemId: 'item-id',
    propertyId: 'property-id',
  });

  app.mount(container);

  return {
    app,
    container,
  };
};

afterEach(() => {
  document.body.innerHTML = '';
  propertyRef.value = {
    default: 'untitled',
    name: 'Title',
    type: 'string',
  };
  valueRef.value = 'untitled';
  storedValueRef.value = undefined;
  postValueMock.mockClear();
});

describe('EditableInlineValue', () => {
  it('preserves the in-progress draft across external value emissions', async () => {
    const { app, container } = mountEditableInlineValue();
    const triggerEl = container.querySelector('.value-inline-stub');

    if (!(triggerEl instanceof HTMLButtonElement)) {
      throw new Error('Expected inline trigger button');
    }

    triggerEl.click();
    await nextTick();

    const inputEl = container.querySelector('input');

    if (!(inputEl instanceof HTMLInputElement)) {
      throw new Error('Expected inline editor input');
    }

    inputEl.value = 'draft';
    inputEl.dispatchEvent(new Event('input'));
    await nextTick();

    valueRef.value = 'changed externally';
    storedValueRef.value = 'stored externally';
    await nextTick();

    expect(inputEl.value).toBe('draft');
    expect(postValueMock).not.toHaveBeenCalled();

    app.unmount();
  });

  it('initializes a new edit session from the latest effective value', async () => {
    const { app, container } = mountEditableInlineValue();
    const triggerEl = container.querySelector('.value-inline-stub');

    if (!(triggerEl instanceof HTMLButtonElement)) {
      throw new Error('Expected inline trigger button');
    }

    valueRef.value = 'latest value';
    await nextTick();

    triggerEl.click();
    await nextTick();

    const inputEl = container.querySelector('input');

    if (!(inputEl instanceof HTMLInputElement)) {
      throw new Error('Expected inline editor input');
    }

    expect(inputEl.value).toBe('latest value');

    app.unmount();
  });

  it('starts the next edit session from the latest effective value after commit', async () => {
    const { app, container } = mountEditableInlineValue();
    const triggerEl = container.querySelector('.value-inline-stub');

    if (!(triggerEl instanceof HTMLButtonElement)) {
      throw new Error('Expected inline trigger button');
    }

    triggerEl.click();
    await nextTick();

    const firstInputEl = container.querySelector('input');

    if (!(firstInputEl instanceof HTMLInputElement)) {
      throw new Error('Expected inline editor input');
    }

    firstInputEl.value = 'draft';
    firstInputEl.dispatchEvent(new Event('input'));
    firstInputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await nextTick();

    valueRef.value = 'saved externally';
    await nextTick();

    triggerEl.click();
    await nextTick();

    const secondInputEl = container.querySelector('input');

    if (!(secondInputEl instanceof HTMLInputElement)) {
      throw new Error('Expected reopened inline editor input');
    }

    expect(secondInputEl.value).toBe('saved externally');

    app.unmount();
  });

  it('starts the next edit session from the latest effective value after cancel', async () => {
    const { app, container } = mountEditableInlineValue();
    const triggerEl = container.querySelector('.value-inline-stub');

    if (!(triggerEl instanceof HTMLButtonElement)) {
      throw new Error('Expected inline trigger button');
    }

    triggerEl.click();
    await nextTick();

    const firstInputEl = container.querySelector('input');

    if (!(firstInputEl instanceof HTMLInputElement)) {
      throw new Error('Expected inline editor input');
    }

    firstInputEl.value = 'draft';
    firstInputEl.dispatchEvent(new Event('input'));
    firstInputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    await nextTick();

    valueRef.value = 'new external value';
    await nextTick();

    triggerEl.click();
    await nextTick();

    const secondInputEl = container.querySelector('input');

    if (!(secondInputEl instanceof HTMLInputElement)) {
      throw new Error('Expected reopened inline editor input');
    }

    expect(secondInputEl.value).toBe('new external value');
    expect(postValueMock).not.toHaveBeenCalledWith('draft');

    app.unmount();
  });

  it('toggles boolean values immediately without opening the editor', async () => {
    propertyRef.value = {
      default: false,
      indeterminate: true,
      name: 'Done',
      type: 'boolean',
    };
    valueRef.value = undefined;

    const { app, container } = mountEditableInlineValue();
    const triggerEl = container.querySelector('.value-inline-stub');

    if (!(triggerEl instanceof HTMLButtonElement)) {
      throw new Error('Expected inline trigger button');
    }

    triggerEl.dispatchEvent(new MouseEvent('click', { bubbles: false }));
    await nextTick();

    expect(container.querySelector('input')).toBeNull();
    expect(postValueMock).toHaveBeenCalledWith(false);

    app.unmount();
  });

  it('uses the wrapper as the only tab stop for boolean inline values', () => {
    propertyRef.value = {
      default: false,
      indeterminate: true,
      name: 'Done',
      type: 'boolean',
    };

    const { app, container } = mountEditableInlineValue();
    const wrapperEl = container.querySelector('.editable-inline-value');
    const inlineButtonEl = container.querySelector('.value-inline-stub');

    if (!(wrapperEl instanceof HTMLDivElement)) {
      throw new Error('Expected inline wrapper');
    }

    if (!(inlineButtonEl instanceof HTMLButtonElement)) {
      throw new Error('Expected inline trigger button');
    }

    expect(wrapperEl.getAttribute('tabindex')).toBe('0');
    expect(wrapperEl.getAttribute('role')).toBe('checkbox');
    expect(inlineButtonEl.getAttribute('tabindex')).toBe('-1');

    app.unmount();
  });

  it('toggles boolean values from wrapper keyboard interaction', async () => {
    propertyRef.value = {
      default: false,
      indeterminate: true,
      name: 'Done',
      type: 'boolean',
    };
    valueRef.value = undefined;

    const { app, container } = mountEditableInlineValue();
    const wrapperEl = container.querySelector('.editable-inline-value');

    if (!(wrapperEl instanceof HTMLDivElement)) {
      throw new Error('Expected inline wrapper');
    }

    wrapperEl.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: ' ' }));
    await nextTick();

    expect(container.querySelector('input')).toBeNull();
    expect(postValueMock).toHaveBeenCalledWith(false);

    app.unmount();
  });

  it('passes the clamped string input size to the inline editor', async () => {
    valueRef.value = 'x'.repeat(60);

    const { app, container } = mountEditableInlineValue();
    const triggerEl = container.querySelector('.value-inline-stub');

    if (!(triggerEl instanceof HTMLButtonElement)) {
      throw new Error('Expected inline trigger button');
    }

    triggerEl.click();
    await nextTick();

    const inputEl = container.querySelector('input');

    if (!(inputEl instanceof HTMLInputElement)) {
      throw new Error('Expected inline editor input');
    }

    expect(inputEl.dataset.inputSize).toBe('48');

    app.unmount();
  });
});

/* eslint-enable vue/one-component-per-file -- restore the default rule after local test stubs. */
