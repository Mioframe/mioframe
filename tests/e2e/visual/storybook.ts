import type { Page } from '@playwright/test';

/**
 * @param page - The Playwright page used by the visual test.
 * @param storyId - The stable Storybook story id from `index.json`.
 * @param options - Optional Storybook globals to apply to the opened story.
 */
export const openStory = async (
  page: Page,
  storyId: string,
  options?: { globals?: Record<string, string> },
) => {
  const params = new URLSearchParams({
    id: storyId,
    viewMode: 'story',
  });

  for (const [key, value] of Object.entries(options?.globals ?? {})) {
    params.append('globals', `${key}:${value}`);
  }

  await page.goto(`/iframe.html?${params.toString()}`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
};

/**
 * @param page - The Playwright page used by the visual test.
 */
export const disableAnimations = async (page: Page) => {
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
    `,
  });
};
