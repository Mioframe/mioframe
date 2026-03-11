import { useHead } from '@unhead/vue';
import { usePreferredColorScheme } from '@vueuse/core';
import { delay } from 'es-toolkit';
import { computed, shallowRef, watch } from 'vue';

/**
 * Sets up dynamic theme-color meta tag based on body background color.
 *
 * Automatically syncs the theme-color meta tag with the current body background color,
 * reacting to color scheme changes (light/dark mode).
 *
 * @example
 * ```ts
 * // Call once in app initialization
 * setupMetaThemeColor();
 * ```
 */
export const setupMetaThemeColor = () => {
  const preferredColor = usePreferredColorScheme();

  const bodyStyle = shallowRef<CSSStyleDeclaration>();

  const updateBodyStyle = () => {
    bodyStyle.value = getComputedStyle(document.body);
  };

  const bodyBackground = computed(() => bodyStyle.value?.backgroundColor);

  const themeColorContent = computed(() => bodyBackground.value);

  useHead({
    meta: [
      {
        name: 'theme-color',
        content: themeColorContent,
      },
    ],
  });

  watch(
    preferredColor,
    async () => {
      await delay(300);
      updateBodyStyle();
    },
    { immediate: true, flush: 'post' },
  );
};
