import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import MDEmptyState from './MDEmptyState.vue';

describe('MDEmptyState', () => {
  it('makes the existing supporting-text owner a polite status when requested', () => {
    const wrapper = mount(MDEmptyState, {
      props: {
        headline: 'Permission required',
        supportingText: 'Waiting for browser permission.',
        supportingTextStatus: true,
      },
    });

    const supportingText = wrapper.get('.md-empty-state__supporting-text');

    expect(supportingText.attributes('role')).toBe('status');
    expect(supportingText.attributes('aria-live')).toBe('polite');
  });

  it('does not create a live region for ordinary supporting text', () => {
    const wrapper = mount(MDEmptyState, {
      props: {
        headline: 'Permission required',
        supportingText: 'Browser permission is required.',
      },
    });

    const supportingText = wrapper.get('.md-empty-state__supporting-text');

    expect(supportingText.attributes('role')).toBeUndefined();
    expect(supportingText.attributes('aria-live')).toBeUndefined();
  });
});
