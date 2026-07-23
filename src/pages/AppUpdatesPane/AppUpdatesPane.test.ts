/* eslint-disable vue/one-component-per-file -- Narrow direct-child stubs document the pane contract. */
import { mount } from '@vue/test-utils';
import { computed, defineComponent, h, ref } from 'vue';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppUpdateActionResult, AppUpdateSnapshot } from '@shared/serviceClient/appUpdate';

const snapshot = ref<AppUpdateSnapshot>({
  capability: 'available',
  mode: 'manual',
  runningRelease: {
    releaseId: 'a'.repeat(40),
    releaseSequence: 1,
    appVersion: '1.0.0',
    buildId: 'aaaaaaa',
    buildDate: '2026-07-23T00:00:00.000Z',
  },
  pinnedRelease: {
    releaseId: 'a'.repeat(40),
    releaseSequence: 1,
    appVersion: '1.0.0',
    buildId: 'aaaaaaa',
    buildDate: '2026-07-23T00:00:00.000Z',
  },
  latestRelease: {
    releaseId: 'b'.repeat(40),
    releaseSequence: 2,
    appVersion: '1.0.0',
    buildId: 'bbbbbbb',
    buildDate: '2026-07-24T00:00:00.000Z',
  },
  checkState: 'succeeded',
  preparationState: 'ready',
  activationState: 'idle',
  lastSuccessfulCheckAt: '2026-07-24T00:00:00.000Z',
});
const checkPending = ref(false);
const modePending = ref(false);
const applyPending = ref(false);
const checkResult = ref<AppUpdateActionResult>();
const modeResult = ref<AppUpdateActionResult>();
const applyResult = ref<AppUpdateActionResult>();
const checkForUpdates = vi.fn();
const setMode = vi.fn();
const updateNow = vi.fn();

vi.mock('@entity/appUpdate', () => ({
  useAppUpdate: () => ({
    snapshot,
    hasUpdate: computed(
      () =>
        !!snapshot.value.latestRelease &&
        !!snapshot.value.runningRelease &&
        snapshot.value.latestRelease.releaseSequence >
          snapshot.value.runningRelease.releaseSequence,
    ),
  }),
}));
vi.mock('@feature/appUpdateCheck', () => ({
  useCheckForAppUpdates: () => ({ pending: checkPending, result: checkResult, checkForUpdates }),
}));
vi.mock('@feature/appUpdateModeChange', () => ({
  useChangeAppUpdateMode: () => ({ pending: modePending, result: modeResult, setMode }),
}));
vi.mock('@feature/appUpdateApply', () => ({
  useApplyAppUpdate: () => ({ pending: applyPending, result: applyResult, updateNow }),
}));
vi.mock('@shared/ui/AppBar', () => ({
  MDAppBar: defineComponent({
    props: { headline: String },
    setup:
      (props, { slots }) =>
      () =>
        h('header', [h('h1', props.headline), slots.leadingButton?.()]),
  }),
}));
vi.mock('@shared/ui/Layout', () => ({
  MDPane: defineComponent({
    setup:
      (_props, { slots }) =>
      () =>
        h('main', [slots.topBar?.(), slots.default?.()]),
  }),
}));
vi.mock('@shared/ui/Button', () => ({
  MDButton: defineComponent({
    props: { label: String, disabled: Boolean },
    emits: ['click'],
    setup:
      (props, { emit }) =>
      () =>
        h(
          'button',
          {
            disabled: props.disabled,
            onClick: () => {
              emit('click');
            },
          },
          props.label,
        ),
  }),
}));
vi.mock('@widget/SettingsSections', () => ({
  SettingsSwitchListItem: defineComponent({
    props: { headline: String, supportingText: String, checked: Boolean, disabled: Boolean },
    emits: ['change'],
    setup:
      (props, { emit }) =>
      () =>
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
          [props.headline, props.supportingText],
        ),
  }),
}));

describe('AppUpdatesPane', () => {
  beforeEach(() => {
    const { errorCode, ...withoutError } = snapshot.value;
    void errorCode;
    snapshot.value = {
      ...withoutError,
      capability: 'available',
      mode: 'manual',
      checkState: 'succeeded',
      preparationState: 'ready',
      activationState: 'idle',
    };
    checkResult.value = modeResult.value = applyResult.value = undefined;
    checkForUpdates.mockClear();
    setMode.mockClear();
    updateNow.mockClear();
  });

  it('shows factual same-SemVer release facts, Manual copy, and one update action', async () => {
    const { default: AppUpdatesPane } = await import('./AppUpdatesPane.vue');
    const wrapper = mount(AppUpdatesPane);
    expect(wrapper.text()).toContain('Update ready');
    expect(wrapper.text()).toContain('Current version: 1.0.0');
    expect(wrapper.text()).toContain('Latest confirmed version: 1.0.0');
    expect(wrapper.text()).toContain('stays pinned until you choose Update now');
    expect(wrapper.text()).not.toContain('sequence');
    expect(
      wrapper.findAll('button').filter((button) => button.text() === 'Update now'),
    ).toHaveLength(1);
    await wrapper
      .findAll('button')
      .find((button) => button.text() === 'Update now')
      ?.trigger('click');
    expect(updateNow).toHaveBeenCalledTimes(1);
  });

  it('keeps failed checks distinct from Up to date and explains restart blocking', async () => {
    const { default: AppUpdatesPane } = await import('./AppUpdatesPane.vue');
    snapshot.value = { ...snapshot.value, checkState: 'failed', errorCode: 'checkFailed' };
    const wrapper = mount(AppUpdatesPane);
    expect(wrapper.text()).toContain('Could not check for updates');
    expect(wrapper.text()).not.toContain('Up to date');
    snapshot.value = {
      ...snapshot.value,
      checkState: 'succeeded',
      activationState: 'blockedByWindow',
      errorCode: 'restartUnresponsive',
    };
    await wrapper.vm.$nextTick();
    expect(wrapper.text()).toContain('Restart blocked');
    expect(wrapper.text()).toContain('open Mioframe window');
  });
});
/* eslint-enable vue/one-component-per-file -- End direct-child stubs. */
