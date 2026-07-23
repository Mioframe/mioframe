/* eslint-disable vue/one-component-per-file -- Narrow direct-child stubs document the pane contract. */
import { mount } from '@vue/test-utils';
import { computed, defineComponent, h, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = ref({
  schemaVersion: 1 as const,
  mode: 'manual' as const,
  activeRelease: {
    releaseId: 'a'.repeat(40),
    appVersion: '1.0.0',
    buildId: 'aaaaaaa',
    buildDate: '2026-07-23T00:00:00.000Z',
  },
  confirmedLatestRelease: {
    releaseId: 'b'.repeat(40),
    appVersion: '1.1.0',
    buildId: 'bbbbbbb',
    buildDate: '2026-07-24T00:00:00.000Z',
  },
  lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
});
const status = ref<
  | 'notChecked'
  | 'checking'
  | 'upToDate'
  | 'available'
  | 'preparing'
  | 'ready'
  | 'checkFailed'
  | 'prepareFailed'
  | 'restartBlocked'
  | 'statusUnavailable'
>('available');
const errorCode = ref();
const operation = ref();
const checkForUpdates = vi.fn();
const setAutomatic = vi.fn();
const updateNow = vi.fn();

vi.mock('@feature/appUpdate', () => ({
  useAppUpdateActions: () => ({
    state,
    status,
    errorCode,
    operation,
    runningRelease: computed(() => state.value.activeRelease),
    latestRelease: computed(() => state.value.confirmedLatestRelease),
    hasUpdate: computed(() => true),
    checkForUpdates,
    setAutomatic,
    updateNow,
  }),
}));

vi.mock('@shared/ui/AppBar', () => ({
  MDAppBar: defineComponent({
    props: { headline: String },
    setup(props, { slots }) {
      return () => h('header', [h('h1', props.headline), slots.leadingButton?.()]);
    },
  }),
}));
vi.mock('@shared/ui/Layout', () => ({
  MDPane: defineComponent({
    setup(_props, { slots }) {
      return () => h('main', [slots.topBar?.(), slots.default?.()]);
    },
  }),
}));
vi.mock('@shared/ui/Button', () => ({
  MDButton: defineComponent({
    props: { label: String, disabled: Boolean },
    emits: ['click'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            disabled: props.disabled,
            onClick: () => {
              emit('click', new MouseEvent('click'));
            },
          },
          props.label,
        );
    },
  }),
}));
vi.mock('@widget/SettingsSections', () => ({
  SettingsSwitchListItem: defineComponent({
    props: { headline: String, checked: Boolean, disabled: Boolean },
    emits: ['change'],
    setup(props, { emit }) {
      return () =>
        h(
          'button',
          {
            role: 'switch',
            'aria-checked': String(props.checked),
            disabled: props.disabled,
            onClick: () => {
              emit('change');
            },
          },
          props.headline,
        );
    },
  }),
}));

describe('AppUpdatesPane', () => {
  beforeEach(() => {
    status.value = 'available';
    errorCode.value = undefined;
    operation.value = undefined;
    checkForUpdates.mockClear();
    setAutomatic.mockClear();
    updateNow.mockClear();
  });

  it('keeps running, latest, mode and check facts distinct and exposes one primary action', async () => {
    const { default: AppUpdatesPane } = await import('./AppUpdatesPane.vue');
    const wrapper = mount(AppUpdatesPane);
    expect(wrapper.text()).toContain('Update available');
    expect(wrapper.text()).toContain('Current version: 1.0.0');
    expect(wrapper.text()).toContain('Latest confirmed version: 1.1.0');
    expect(wrapper.get('[role="switch"]').attributes('aria-checked')).toBe('false');
    expect(
      wrapper.findAll('button').filter((button) => button.text() === 'Update now'),
    ).toHaveLength(1);
    await wrapper.get('button').trigger('click');
    expect(updateNow).toHaveBeenCalledTimes(1);
  });

  it('renders factual failed-check and blocked explanations without Up to date', async () => {
    const { default: AppUpdatesPane } = await import('./AppUpdatesPane.vue');
    status.value = 'checkFailed';
    errorCode.value = 'checkFailed';
    const wrapper = mount(AppUpdatesPane);
    expect(wrapper.text()).toContain('Could not check for updates');
    expect(wrapper.text()).toContain('could not confirm whether a newer version is available');
    expect(wrapper.text()).not.toContain('Up to date');

    status.value = 'restartBlocked';
    errorCode.value = 'restartBusy';
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Restart blocked');
    expect(wrapper.text()).toContain('Changes are still being saved');
  });
});
/* eslint-enable vue/one-component-per-file -- End narrow test stubs. */
