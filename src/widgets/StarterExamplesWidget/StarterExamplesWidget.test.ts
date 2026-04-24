/* eslint-disable vue/one-component-per-file -- test file keeps local stub components next to the widget mount for a compact render contract test. */

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const createShoppingExampleMock = vi.fn();
const createWeeklyPlanExampleMock = vi.fn();
const isCreatingShoppingExample = ref(false);
const isCreatingWeeklyPlanExample = ref(false);
const shoppingErrorMessage = ref<string>();
const weeklyPlanErrorMessage = ref<string>();

vi.mock('@feature/exampleDocumentsCreate', () => ({
  ExampleDocumentCreateCard: defineComponent({
    name: 'ExampleDocumentCreateCardStub',

    props: {
      definition: {
        required: true,
        type: Object,
      },
      errorMessage: {
        required: false,
        type: String,
      },
      isBusy: {
        required: true,
        type: Boolean,
      },
      isLoading: {
        required: true,
        type: Boolean,
      },
    },

    emits: {
      create: () => true,
    },

    setup(props, { emit }) {
      return () => h('button', createButtonProps(props, emit), getDefinitionId(props.definition));
    },
  }),
  useExampleDocumentsCreate: () => ({
    createShoppingExample: createShoppingExampleMock,
    createWeeklyPlanExample: createWeeklyPlanExampleMock,
    isCreatingShoppingExample,
    isCreatingWeeklyPlanExample,
    shoppingErrorMessage,
    weeklyPlanErrorMessage,
  }),
}));

vi.mock('@feature/starterExamplesDismiss', () => ({
  StarterExamplesDismissButton: defineComponent({
    name: 'StarterExamplesDismissButtonStub',

    setup() {
      return () => h('div', { class: 'starter-examples-dismiss-button-stub' });
    },
  }),
}));

vi.mock('@shared/ui/Card', () => ({
  MDCard: defineComponent({
    name: 'MDCardStub',

    setup(_props, { slots }) {
      return () => h('div', slots.default?.());
    },
  }),
}));

import StarterExamplesWidget from './StarterExamplesWidget.vue';

const getDefinitionId = (definition: unknown) => {
  if (
    typeof definition !== 'object' ||
    definition === null ||
    !('id' in definition) ||
    typeof definition.id !== 'string'
  ) {
    throw new Error('Expected starter example definition');
  }

  return definition.id;
};

const createButtonProps = (
  props: {
    definition: unknown;
    errorMessage: string | undefined;
    isBusy: boolean;
    isLoading: boolean;
  },
  emit: (event: 'create') => void,
) => ({
  class: `example-card-${getDefinitionId(props.definition)}`,
  'data-busy': String(props.isBusy),
  'data-error': props.errorMessage ?? '',
  'data-loading': String(props.isLoading),
  type: 'button',
  onClick: () => {
    emit('create');
  },
});

const mountStarterExamplesWidget = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const openDocumentSpy = vi.fn();

  const app = createApp(
    defineComponent({
      name: 'StarterExamplesWidgetTestHost',

      setup() {
        return () => h(StarterExamplesWidget, { onOpenDocument: openDocumentSpy });
      },
    }),
  );

  app.mount(container);

  return {
    app,
    container,
    openDocumentSpy,
  };
};

beforeEach(() => {
  createShoppingExampleMock.mockReset();
  createWeeklyPlanExampleMock.mockReset();
  createShoppingExampleMock.mockResolvedValue({
    documentDirectory: '/examples',
    documentId: 'shopping-doc-id',
  });
  createWeeklyPlanExampleMock.mockResolvedValue({
    documentDirectory: '/examples',
    documentId: 'weekly-doc-id',
  });
  isCreatingShoppingExample.value = false;
  isCreatingWeeklyPlanExample.value = false;
  shoppingErrorMessage.value = undefined;
  weeklyPlanErrorMessage.value = undefined;
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('StarterExamplesWidget', () => {
  it('shares one busy state across both example cards', async () => {
    const { app, container } = mountStarterExamplesWidget();

    const weeklyCard = container.querySelector('.example-card-weeklyPlan');
    const shoppingCard = container.querySelector('.example-card-shopping');

    if (
      !(weeklyCard instanceof HTMLButtonElement) ||
      !(shoppingCard instanceof HTMLButtonElement)
    ) {
      throw new Error('Expected example card buttons');
    }

    expect(weeklyCard.dataset.busy).toBe('false');
    expect(shoppingCard.dataset.busy).toBe('false');
    expect(weeklyCard.dataset.loading).toBe('false');
    expect(shoppingCard.dataset.loading).toBe('false');

    isCreatingWeeklyPlanExample.value = true;
    await nextTick();

    expect(weeklyCard.dataset.busy).toBe('true');
    expect(shoppingCard.dataset.busy).toBe('true');
    expect(weeklyCard.dataset.loading).toBe('true');
    expect(shoppingCard.dataset.loading).toBe('false');

    app.unmount();
  });

  it('creates the requested example and emits the opened document payload', async () => {
    const { app, container, openDocumentSpy } = mountStarterExamplesWidget();
    const shoppingCard = container.querySelector('.example-card-shopping');

    if (!(shoppingCard instanceof HTMLButtonElement)) {
      throw new Error('Expected shopping example card button');
    }

    shoppingCard.click();
    await Promise.resolve();
    await nextTick();

    expect(createShoppingExampleMock).toHaveBeenCalledTimes(1);
    expect(createWeeklyPlanExampleMock).not.toHaveBeenCalled();
    expect(openDocumentSpy).toHaveBeenCalledWith({
      documentDirectory: '/examples',
      documentId: 'shopping-doc-id',
    });

    app.unmount();
  });
});
