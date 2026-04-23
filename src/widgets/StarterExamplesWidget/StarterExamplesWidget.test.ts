/* eslint-disable vue/one-component-per-file -- compact widget test uses local stubs to keep the storage and navigation wiring focused. */

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const settings = ref<{ hideStarterWidget?: boolean }>({});
const createWeeklyPlanExampleMock = vi.fn();
const createShoppingExampleMock = vi.fn();
const isCreatingWeeklyPlanExample = ref(false);
const isCreatingShoppingExample = ref(false);
const weeklyPlanErrorMessage = ref<string>();
const shoppingErrorMessage = ref<string>();

vi.mock('@entity/localSettings', () => ({
  useLocalSettings: () => ({
    settings,
  }),
}));

vi.mock('@feature/exampleDocumentsCreate', () => ({
  useExampleDocumentsCreate: () => ({
    createWeeklyPlanExample: createWeeklyPlanExampleMock,
    createShoppingExample: createShoppingExampleMock,
    isCreatingWeeklyPlanExample,
    isCreatingShoppingExample,
    weeklyPlanErrorMessage,
    shoppingErrorMessage,
  }),
}));

vi.mock('@shared/ui/Button', () => ({
  MDButton: defineComponent({
    name: 'MDButtonStub',
    props: {
      disabled: { required: false, type: Boolean },
      label: { required: true, type: String },
      loading: { required: false, type: [Boolean, Number] },
    },
    emits: ['click'],
    setup(props, { emit, slots }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            disabled: props.disabled,
            'data-label': props.label,
            onClick: () => {
              emit('click');
            },
          },
          slots.icon ? [slots.icon()] : props.label,
        );
    },
  }),
  MDIconButton: defineComponent({
    name: 'MDIconButtonStub',
    props: {
      tooltip: { required: true, type: String },
    },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            type: 'button',
            'data-tooltip': props.tooltip,
            onClick: () => {
              emit('click');
            },
          },
          props.tooltip,
        );
    },
  }),
}));

vi.mock('@shared/ui/Icon', () => ({
  MDSymbol: defineComponent({
    name: 'MDSymbolStub',
    props: {
      name: { required: true, type: String },
    },
    setup(props) {
      return () => h('span', { 'data-symbol': props.name });
    },
  }),
}));

import StarterExamplesWidget from './StarterExamplesWidget.vue';

const mountStarterExamplesWidget = (onOpenDocument = vi.fn()) => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const app = createApp(
    defineComponent({
      name: 'StarterExamplesWidgetHost',
      setup() {
        return () =>
          settings.value.hideStarterWidget ? null : h(StarterExamplesWidget, { onOpenDocument });
      },
    }),
  );

  app.mount(container);

  return { app, container };
};

describe('StarterExamplesWidget', () => {
  beforeEach(() => {
    settings.value = {};
    createWeeklyPlanExampleMock.mockReset();
    createShoppingExampleMock.mockReset();
    createWeeklyPlanExampleMock.mockResolvedValue(undefined);
    createShoppingExampleMock.mockResolvedValue(undefined);
    weeklyPlanErrorMessage.value = undefined;
    shoppingErrorMessage.value = undefined;
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('shows the starter examples widget for undefined settings and hides it on dismiss', async () => {
    const { app, container } = mountStarterExamplesWidget();

    expect(container.querySelector('[data-label="Open Weekly Plan Example"]')).not.toBeNull();

    const dismissButton = container.querySelector('[data-tooltip="Hide starter examples"]');

    if (!(dismissButton instanceof HTMLButtonElement)) {
      throw new Error('Expected dismiss button');
    }

    dismissButton.click();
    await nextTick();

    expect(settings.value.hideStarterWidget).toBe(true);
    expect(container.textContent).not.toContain('Open Weekly Plan Example');

    app.unmount();
  });

  it('creates examples internally and emits the created document payload', async () => {
    createWeeklyPlanExampleMock.mockResolvedValueOnce({
      documentDirectory: '/Device Files/Browser Storage/Examples',
      documentId: 'weekly-doc-id',
    });
    createShoppingExampleMock.mockResolvedValueOnce({
      documentDirectory: '/Device Files/Browser Storage/Examples 2',
      documentId: 'shopping-doc-id',
    });

    const onOpenDocument = vi.fn();
    const { app, container } = mountStarterExamplesWidget(onOpenDocument);

    const weeklyButton = container.querySelector('[data-label="Open Weekly Plan Example"]');
    const shoppingButton = container.querySelector('[data-label="Open Shopping Example"]');

    if (
      !(weeklyButton instanceof HTMLButtonElement) ||
      !(shoppingButton instanceof HTMLButtonElement)
    ) {
      throw new Error('Expected example action buttons');
    }

    weeklyButton.click();
    await Promise.resolve();
    shoppingButton.click();
    await Promise.resolve();

    expect(onOpenDocument).toHaveBeenNthCalledWith(1, {
      documentDirectory: '/Device Files/Browser Storage/Examples',
      documentId: 'weekly-doc-id',
    });
    expect(onOpenDocument).toHaveBeenNthCalledWith(2, {
      documentDirectory: '/Device Files/Browser Storage/Examples 2',
      documentId: 'shopping-doc-id',
    });

    app.unmount();
  });

  it('does not emit an open request when example creation is cancelled or fails', async () => {
    const onOpenDocument = vi.fn();
    const { app, container } = mountStarterExamplesWidget(onOpenDocument);

    const weeklyButton = container.querySelector('[data-label="Open Weekly Plan Example"]');
    const shoppingButton = container.querySelector('[data-label="Open Shopping Example"]');

    if (
      !(weeklyButton instanceof HTMLButtonElement) ||
      !(shoppingButton instanceof HTMLButtonElement)
    ) {
      throw new Error('Expected example action buttons');
    }

    weeklyButton.click();
    await Promise.resolve();
    shoppingButton.click();
    await Promise.resolve();

    expect(onOpenDocument).not.toHaveBeenCalled();

    app.unmount();
  });
});
