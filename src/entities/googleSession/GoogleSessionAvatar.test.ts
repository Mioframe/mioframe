/* eslint-disable vue/one-component-per-file -- test file keeps local stub components and a mount host together for a compact render smoke test. */

import { createApp, defineComponent, h, nextTick, ref } from 'vue';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const profileImageBlobUrl = ref<string>();
const showProfileImage = ref(false);
const isLoading = ref(false);

vi.mock('@shared/ui/Icon', () => ({
  MDSymbol: defineComponent({
    name: 'MDSymbolStub',

    props: {
      name: {
        required: true,
        type: String,
      },
    },

    setup(props) {
      return () => h('div', { 'data-symbol': props.name });
    },
  }),
}));

vi.mock('@shared/ui/ProgressIndicators', () => ({
  MDCircularProgressIndicator: defineComponent({
    name: 'MDCircularProgressIndicatorStub',

    props: {
      size: {
        required: false,
        type: Number,
      },
    },

    setup(props) {
      return () => h('div', { 'data-progress-size': String(props.size ?? '') });
    },
  }),
}));

vi.mock('./useGoogleSessionAvatar', () => ({
  useGoogleSessionAvatar: () => ({
    isLoading,
    profileImageBlobUrl,
    showProfileImage,
  }),
}));

import GoogleSessionAvatar from './GoogleSessionAvatar.vue';

const mountGoogleSessionAvatar = () => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const app = createApp(
    defineComponent({
      name: 'GoogleSessionAvatarTestHost',

      setup() {
        return () => h(GoogleSessionAvatar, { profileImageUrl: 'https://example.com/avatar.png' });
      },
    }),
  );

  app.mount(container);

  return {
    app,
    container,
  };
};

beforeEach(() => {
  profileImageBlobUrl.value = undefined;
  showProfileImage.value = false;
  isLoading.value = false;
});

afterEach(() => {
  document.body.innerHTML = '';
});

describe('GoogleSessionAvatar', () => {
  it('renders fallback, loading, and image states from the avatar composition', async () => {
    const { app, container } = mountGoogleSessionAvatar();

    expect(container.querySelector('[data-symbol="account_circle"]')).not.toBeNull();
    expect(container.querySelector('[data-progress-size="24"]')).toBeNull();
    expect(container.querySelector('img')).toBeNull();

    isLoading.value = true;
    await nextTick();

    expect(container.querySelector('[data-symbol="account_circle"]')).toBeNull();
    expect(container.querySelector('[data-progress-size="24"]')).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();

    profileImageBlobUrl.value = 'blob:avatar';
    showProfileImage.value = true;
    isLoading.value = false;
    await nextTick();

    const avatarImage = container.querySelector('img');

    if (!(avatarImage instanceof HTMLImageElement)) {
      throw new Error('Expected rendered avatar image');
    }

    expect(avatarImage.getAttribute('src')).toBe('blob:avatar');
    expect(container.querySelector('[data-progress-size="24"]')).toBeNull();
    expect(container.querySelector('[data-symbol="account_circle"]')).toBeNull();

    app.unmount();
  });
});
