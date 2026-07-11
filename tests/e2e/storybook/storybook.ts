import type { Page } from '@playwright/test';

/**
 * @param page - The Playwright page used by the behavior test.
 * @param storyId - The stable Storybook story id from `index.json`.
 */
export const openStory = async (page: Page, storyId: string) => {
  const params = new URLSearchParams({ id: storyId, viewMode: 'story' });

  await page.goto(`/iframe.html?${params.toString()}`);
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await document.fonts.ready;
  });
};
